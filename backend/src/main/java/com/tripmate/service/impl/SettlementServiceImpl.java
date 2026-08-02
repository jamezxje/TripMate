package com.tripmate.service.impl;

import com.tripmate.dto.response.SettlementSummaryResponse;
import com.tripmate.dto.response.SuggestedTransferDTO;
import com.tripmate.dto.response.UserBalanceDTO;
import com.tripmate.entity.*;
import com.tripmate.enums.Role;
import com.tripmate.enums.TripStatus;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.*;
import com.tripmate.service.SettlementService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementServiceImpl implements SettlementService {

    private final SettlementRepository settlementRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final FundContributionRepository fundContributionRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;

    @Override
    @Transactional
    public SettlementSummaryResponse getSettlementSummary(Long tripId) {
        log.info("Bắt đầu tính toán số dư quyết toán cho chuyến đi ID: {}", tripId);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        List<TripMember> members = tripMemberRepository.findByTripId(tripId);

        List<UserBalanceDTO> balances = new ArrayList<>();
        for (TripMember member : members) {
            User user = member.getUser();
            Long userId = user.getId();

            BigDecimal totalFundContributed = fundContributionRepository.sumAmountByTripIdAndUserId(tripId, userId);
            if (totalFundContributed == null) totalFundContributed = BigDecimal.ZERO;

            BigDecimal totalPaidOutOfPocket = expenseRepository.sumAmountPaidByPayerId(tripId, userId);
            if (totalPaidOutOfPocket == null) totalPaidOutOfPocket = BigDecimal.ZERO;

            BigDecimal totalAmountOwed = expenseSplitRepository.sumAmountOwedByTripIdAndUserId(tripId, userId);
            if (totalAmountOwed == null) totalAmountOwed = BigDecimal.ZERO;

            BigDecimal netBalance = totalFundContributed.add(totalPaidOutOfPocket).subtract(totalAmountOwed);

            UserBalanceDTO userBalance = UserBalanceDTO.builder()
                    .userId(userId)
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .totalFundContributed(totalFundContributed)
                    .totalPaidOutOfPocket(totalPaidOutOfPocket)
                    .totalAmountOwed(totalAmountOwed)
                    .netBalance(netBalance)
                    .build();

            balances.add(userBalance);
            log.debug("Số dư thành viên ID: {} ({}): Đã đóng quỹ = {}, Tự chi = {}, Cần trả = {}, Số dư ròng = {}",
                    userId, user.getFullName(), totalFundContributed, totalPaidOutOfPocket, totalAmountOwed, netBalance);
        }

        // Create a deep copy of balances for greedy algorithm to adjust
        List<UserBalanceDTO> adjustedBalances = balances.stream()
                .map(b -> UserBalanceDTO.builder()
                        .userId(b.getUserId())
                        .fullName(b.getFullName())
                        .email(b.getEmail())
                        .totalFundContributed(b.getTotalFundContributed())
                        .totalPaidOutOfPocket(b.getTotalPaidOutOfPocket())
                        .totalAmountOwed(b.getTotalAmountOwed())
                        .netBalance(b.getNetBalance())
                        .build())
                .toList();

        List<Settlement> existingSettlements = settlementRepository.findByTripId(tripId);
        List<Settlement> settled = existingSettlements.stream().filter(Settlement::getIsSettled).toList();
        List<Settlement> unsettled = existingSettlements.stream().filter(s -> !s.getIsSettled()).toList();

        // Adjust balances based on settled transactions
        for (Settlement s : settled) {
            Long fromUserId = s.getFromUser().getId();
            Long toUserId = s.getToUser().getId();
            BigDecimal amount = s.getAmount();

            adjustedBalances.stream().filter(b -> b.getUserId().equals(fromUserId))
                    .findFirst().ifPresent(b -> b.setNetBalance(b.getNetBalance().add(amount)));
            adjustedBalances.stream().filter(b -> b.getUserId().equals(toUserId))
                    .findFirst().ifPresent(b -> b.setNetBalance(b.getNetBalance().subtract(amount)));
        }

        List<Settlement> finalSettlements = new ArrayList<>(settled);

        if (trip.getStatus() != TripStatus.CLOSED) {
            log.info("Chuyến đi chưa đóng. Dọn dẹp {} giao dịch chưa thanh toán cũ và sinh lại giao dịch mới", unsettled.size());
            if (!unsettled.isEmpty()) {
                settlementRepository.deleteAll(unsettled);
            }
            List<Settlement> newlyGenerated = generateGreedySettlements(trip, members, adjustedBalances);
            finalSettlements.addAll(newlyGenerated);
        } else {
            log.info("Chuyến đi đã đóng. Giữ nguyên {} giao dịch đề xuất", existingSettlements.size());
            finalSettlements.addAll(unsettled);
        }

        List<SuggestedTransferDTO> suggestedTransfers = finalSettlements.stream()
                .map(this::mapToSuggestedTransferDTO)
                .toList();

        return SettlementSummaryResponse.builder()
                .tripId(trip.getId())
                .tripName(trip.getName())
                .tripStatus(trip.getStatus())
                .balances(balances)
                .suggestedTransfers(suggestedTransfers)
                .build();
    }

    @Override
    @Transactional
    public SuggestedTransferDTO completeSettlement(Long settlementId, Long currentUserId) {
        log.info("Bắt đầu xử lý đánh dấu hoàn tất giao dịch quyết toán ID: {} bởi người dùng ID: {}", settlementId, currentUserId);
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch quyết toán với ID: " + settlementId));

        Trip trip = settlement.getTrip();
        TripMember member = tripMemberRepository.findByTripIdAndUserId(trip.getId(), currentUserId)
                .orElseThrow(() -> new UnauthorizedAccessException("Bạn không phải là thành viên của chuyến đi này"));

        if (member.getRole() != Role.LEADER) {
            log.warn("Thất bại khi hoàn tất giao dịch: Người dùng ID {} không phải Leader của chuyến đi ID {}", currentUserId, trip.getId());
            throw new UnauthorizedAccessException("Chỉ có Trưởng nhóm (Leader) mới có quyền đánh dấu hoàn tất chuyển khoản");
        }

        settlement.setIsSettled(true);
        Settlement updated = settlementRepository.save(settlement);
        log.info("Đã đánh dấu hoàn tất giao dịch quyết toán ID: {} (Chuyển từ người dùng {} sang người dùng {})",
                settlementId, settlement.getFromUser().getId(), settlement.getToUser().getId());

        // Check if all settlements in the trip are completed
        boolean hasUnsettled = settlementRepository.existsByTripIdAndIsSettledFalse(trip.getId());
        if (!hasUnsettled) {
            trip.setStatus(TripStatus.CLOSED);
            tripRepository.save(trip);
            log.info("Tất cả các giao dịch quyết toán đã hoàn tất! Tự động chuyển trạng thái chuyến đi ID: {} sang CLOSED", trip.getId());
        }

        return mapToSuggestedTransferDTO(updated);
    }

    private List<Settlement> generateGreedySettlements(Trip trip, List<TripMember> members, List<UserBalanceDTO> balances) {
        log.debug("Chạy thuật toán Greedy để tối ưu số lượng giao dịch chuyển tiền cho chuyến đi ID: {}", trip.getId());
        @Data
        @AllArgsConstructor
        class BalanceNode {
            User user;
            BigDecimal amount;
        }

        List<BalanceNode> debtors = new ArrayList<>();
        List<BalanceNode> creditors = new ArrayList<>();

        for (UserBalanceDTO b : balances) {
            User user = members.stream()
                    .filter(m -> m.getUser().getId().equals(b.getUserId()))
                    .findFirst()
                    .map(TripMember::getUser)
                    .orElse(null);

            if (user == null) continue;

            BigDecimal balance = b.getNetBalance();
            if (balance.compareTo(new BigDecimal("-0.009")) < 0) {
                debtors.add(new BalanceNode(user, balance.abs()));
            } else if (balance.compareTo(new BigDecimal("0.009")) > 0) {
                creditors.add(new BalanceNode(user, balance));
            }
        }

        debtors.sort((a, b) -> b.amount.compareTo(a.amount));
        creditors.sort((a, b) -> b.amount.compareTo(a.amount));

        List<Settlement> createdSettlements = new ArrayList<>();
        int d = 0;
        int c = 0;

        while (d < debtors.size() && c < creditors.size()) {
            BalanceNode debtor = debtors.get(d);
            BalanceNode creditor = creditors.get(c);

            BigDecimal transferAmount = debtor.amount.min(creditor.amount);

            if (transferAmount.compareTo(new BigDecimal("0.01")) >= 0) {
                Settlement settlement = Settlement.builder()
                        .trip(trip)
                        .fromUser(debtor.user)
                        .toUser(creditor.user)
                        .amount(transferAmount)
                        .isSettled(false)
                        .build();
                createdSettlements.add(settlementRepository.save(settlement));
                log.debug("Đề xuất giao dịch: Người dùng ID {} ({}) chuyển {} VND cho Người dùng ID {} ({})",
                        debtor.user.getId(), debtor.user.getFullName(), transferAmount,
                        creditor.user.getId(), creditor.user.getFullName());
            }

            debtor.amount = debtor.amount.subtract(transferAmount);
            creditor.amount = creditor.amount.subtract(transferAmount);

            if (debtor.amount.compareTo(new BigDecimal("0.01")) < 0) {
                d++;
            }
            if (creditor.amount.compareTo(new BigDecimal("0.01")) < 0) {
                c++;
            }
        }

        log.info("Thuật toán Greedy tạo thành công {} giao dịch tối ưu cho chuyến đi ID: {}", createdSettlements.size(), trip.getId());
        return createdSettlements;
    }

    private SuggestedTransferDTO mapToSuggestedTransferDTO(Settlement settlement) {
        return SuggestedTransferDTO.builder()
                .id(settlement.getId())
                .fromUserId(settlement.getFromUser().getId())
                .fromUserName(settlement.getFromUser().getFullName())
                .toUserId(settlement.getToUser().getId())
                .toUserName(settlement.getToUser().getFullName())
                .amount(settlement.getAmount())
                .isSettled(settlement.getIsSettled())
                .build();
    }
}
