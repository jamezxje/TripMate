package com.tripmate.service.impl;

import com.tripmate.dto.request.CreateExpenseRequest;
import com.tripmate.dto.request.ExpenseSplitRequest;
import com.tripmate.dto.request.UpdateExpenseRequest;
import com.tripmate.dto.response.ExpenseResponse;
import com.tripmate.dto.response.ExpenseSplitResponse;
import com.tripmate.entity.*;
import com.tripmate.enums.Role;
import com.tripmate.enums.SplitType;
import com.tripmate.exception.InsufficientFundException;
import com.tripmate.exception.InvalidExpenseException;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.*;
import com.tripmate.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;
    private final FundContributionRepository fundContributionRepository;
    private final PlannedExpenseCategoryRepository categoryRepository;

    @Override
    @Transactional
    public ExpenseResponse createExpense(CreateExpenseRequest request, Long currentUserId) {
        log.info("Bắt đầu xử lý tạo khoản chi tiêu: '{}', số tiền: {} VND cho chuyến đi ID: {} bởi người dùng ID: {}",
                request.getDescription(), request.getAmount(), request.getTripId(), currentUserId);

        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + request.getTripId()));

        User createdBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + currentUserId));

        TripMember creatorMember = tripMemberRepository.findByTripIdAndUserId(trip.getId(), currentUserId)
                .orElseThrow(() -> new UnauthorizedAccessException("Bạn không phải là thành viên của chuyến đi này"));

        boolean isPaidByFund;
        User payer = null;

        if (creatorMember.getRole() == Role.MEMBER) {
            isPaidByFund = false;
            payer = createdBy;
            log.debug("Người tạo chi tiêu là MEMBER (ID: {}), tự động thiết lập nguồn trả là cá nhân", currentUserId);
        } else {
            if (Boolean.TRUE.equals(request.getIsPaidByFund())) {
                isPaidByFund = true;
                payer = null;
                log.debug("Người tạo chi tiêu là LEADER (ID: {}), thiết lập nguồn trả là Quỹ chung", currentUserId);
            } else {
                isPaidByFund = false;
                Long targetPayerId = request.getPayerId() != null ? request.getPayerId() : currentUserId;
                payer = userRepository.findById(targetPayerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người thanh toán với ID: " + targetPayerId));
                if (!tripMemberRepository.existsByTripIdAndUserId(trip.getId(), payer.getId())) {
                    throw new UnauthorizedAccessException("Người thanh toán chưa tham gia chuyến đi này");
                }
                log.debug("Người tạo chi tiêu là LEADER (ID: {}), thiết lập người thanh toán là thành viên ID: {}", currentUserId, targetPayerId);
            }
        }

        if (isPaidByFund) {
            BigDecimal totalCollected = fundContributionRepository.sumAmountByTripId(trip.getId());
            if (totalCollected == null) totalCollected = BigDecimal.ZERO;

            BigDecimal totalSpentFromFund = expenseRepository.sumAmountPaidByFundByTripId(trip.getId());
            if (totalSpentFromFund == null) totalSpentFromFund = BigDecimal.ZERO;

            BigDecimal currentFundBalance = totalCollected.subtract(totalSpentFromFund);
            log.info("Kiểm tra số dư quỹ chung chuyến đi ID: {}. Tổng thu: {} VND, Đã chi từ quỹ: {} VND, Dư hiện tại: {} VND",
                    trip.getId(), totalCollected, totalSpentFromFund, currentFundBalance);

            if (currentFundBalance.compareTo(request.getAmount()) < 0) {
                log.warn("Số dư quỹ không đủ thực hiện chi tiêu! Cần: {} VND, Dư hiện tại: {} VND", request.getAmount(), currentFundBalance);
                throw new InsufficientFundException("Số dư quỹ chung không đủ để thực hiện giao dịch này. Dư quỹ hiện tại: "
                        + currentFundBalance + " VND, số tiền cần trả: " + request.getAmount() + " VND");
            }
        }

        List<ExpenseSplitRequest> splitRequests = request.getSplits();
        Map<Long, BigDecimal> computedSplits = computeSplits(request.getAmount(), request.getSplitType(), splitRequests, trip.getId());

        // Resolve category (optional)
        PlannedExpenseCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        }

        Expense expense = Expense.builder()
                .trip(trip)
                .description(request.getDescription().trim())
                .amount(request.getAmount())
                .isPaidByFund(isPaidByFund)
                .payer(payer)
                .splitType(request.getSplitType())
                .createdBy(createdBy)
                .category(category)
                .build();

        Expense savedExpense = expenseRepository.save(expense);
        log.info("Đã lưu chi tiêu mới với ID: {} cho chuyến đi ID: {}", savedExpense.getId(), trip.getId());

        List<ExpenseSplit> expenseSplits = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : computedSplits.entrySet()) {
            User participant = userRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người tham gia với ID: " + entry.getKey()));

            ExpenseSplit split = ExpenseSplit.builder()
                    .expense(savedExpense)
                    .user(participant)
                    .amountOwed(entry.getValue())
                    .build();
            expenseSplits.add(split);
        }

        expenseSplitRepository.saveAll(expenseSplits);
        log.info("Đã lưu {} khoản chia tiền chi tiết cho chi tiêu ID: {}", expenseSplits.size(), savedExpense.getId());

        return mapToExpenseResponse(savedExpense, expenseSplits);
    }

    @Override
    public List<ExpenseResponse> getExpensesByTripId(Long tripId) {
        log.info("Truy vấn danh sách chi tiêu của chuyến đi ID: {}", tripId);
        if (!tripRepository.existsById(tripId)) {
            throw new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId);
        }

        List<Expense> expenses = expenseRepository.findByTripIdOrderByCreatedAtDesc(tripId);
        log.info("Tìm thấy {} khoản chi tiêu cho chuyến đi ID: {}", expenses.size(), tripId);

        return expenses.stream()
                .map(expense -> {
                    List<ExpenseSplit> splits = expenseSplitRepository.findByExpenseId(expense.getId());
                    return mapToExpenseResponse(expense, splits);
                })
                .toList();
    }

    @Override
    @Transactional
    public ExpenseResponse updateExpense(Long expenseId, UpdateExpenseRequest request, Long currentUserId) {
        log.info("Bắt đầu xử lý cập nhật khoản chi tiêu ID: {} bởi người dùng ID: {}", expenseId, currentUserId);

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản chi tiêu với ID: " + expenseId));

        Trip trip = expense.getTrip();

        // Check authorization: only creator or LEADER can edit
        TripMember currentMember = tripMemberRepository.findByTripIdAndUserId(trip.getId(), currentUserId)
                .orElseThrow(() -> new UnauthorizedAccessException("Bạn không phải là thành viên của chuyến đi này"));

        boolean isLeader = currentMember.getRole() == Role.LEADER;
        boolean isCreator = expense.getCreatedBy().getId().equals(currentUserId);

        if (!isLeader && !isCreator) {
            throw new UnauthorizedAccessException("Bạn không có quyền sửa khoản chi tiêu này. Chỉ người tạo hoặc Trưởng nhóm mới có quyền sửa.");
        }

        // Determine payer
        boolean isPaidByFund;
        User payer = null;

        if (!isLeader) {
            // Members can only pay by themselves
            isPaidByFund = false;
            payer = expense.getCreatedBy();
        } else {
            if (Boolean.TRUE.equals(request.getIsPaidByFund())) {
                isPaidByFund = true;
                payer = null;
            } else {
                isPaidByFund = false;
                Long targetPayerId = request.getPayerId() != null ? request.getPayerId() : currentUserId;
                payer = userRepository.findById(targetPayerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người thanh toán với ID: " + targetPayerId));
                if (!tripMemberRepository.existsByTripIdAndUserId(trip.getId(), payer.getId())) {
                    throw new UnauthorizedAccessException("Người thanh toán chưa tham gia chuyến đi này");
                }
            }
        }

        // Validate fund balance if paid by fund (exclude current expense's old amount if it was also paid by fund)
        if (isPaidByFund) {
            BigDecimal totalCollected = fundContributionRepository.sumAmountByTripId(trip.getId());
            if (totalCollected == null) totalCollected = BigDecimal.ZERO;

            BigDecimal totalSpentFromFund = expenseRepository.sumAmountPaidByFundByTripId(trip.getId());
            if (totalSpentFromFund == null) totalSpentFromFund = BigDecimal.ZERO;

            // If this expense was already paid by fund, add back its old amount to available balance
            BigDecimal oldFundAmount = Boolean.TRUE.equals(expense.getIsPaidByFund()) ? expense.getAmount() : BigDecimal.ZERO;
            BigDecimal availableFundBalance = totalCollected.subtract(totalSpentFromFund).add(oldFundAmount);

            if (availableFundBalance.compareTo(request.getAmount()) < 0) {
                throw new InsufficientFundException("Số dư quỹ chung không đủ. Quỹ khả dụng: "
                        + availableFundBalance + " VND, số tiền cần: " + request.getAmount() + " VND");
            }
        }

        // Recompute splits
        Map<Long, BigDecimal> computedSplits = computeSplits(request.getAmount(), request.getSplitType(), request.getSplits(), trip.getId());

        // Resolve category (optional)
        PlannedExpenseCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        }

        // Update expense fields
        expense.setDescription(request.getDescription().trim());
        expense.setAmount(request.getAmount());
        expense.setIsPaidByFund(isPaidByFund);
        expense.setPayer(payer);
        expense.setSplitType(request.getSplitType());
        expense.setCategory(category);

        Expense updatedExpense = expenseRepository.save(expense);

        // Delete old splits and create new ones
        expenseSplitRepository.deleteByExpenseId(expenseId);
        expenseSplitRepository.flush();

        List<ExpenseSplit> newSplits = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : computedSplits.entrySet()) {
            User participant = userRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người tham gia với ID: " + entry.getKey()));

            ExpenseSplit split = ExpenseSplit.builder()
                    .expense(updatedExpense)
                    .user(participant)
                    .amountOwed(entry.getValue())
                    .build();
            newSplits.add(split);
        }

        expenseSplitRepository.saveAll(newSplits);
        log.info("Cập nhật thành công khoản chi tiêu ID: {} với {} phân bổ mới", expenseId, newSplits.size());

        return mapToExpenseResponse(updatedExpense, newSplits);
    }

    @Override
    @Transactional
    public void deleteExpense(Long expenseId, Long currentUserId) {
        log.info("Bắt đầu xử lý xóa khoản chi tiêu ID: {} bởi người dùng ID: {}", expenseId, currentUserId);

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản chi tiêu với ID: " + expenseId));

        Trip trip = expense.getTrip();

        TripMember currentMember = tripMemberRepository.findByTripIdAndUserId(trip.getId(), currentUserId)
                .orElseThrow(() -> new UnauthorizedAccessException("Bạn không phải là thành viên của chuyến đi này"));

        boolean isLeader = currentMember.getRole() == Role.LEADER;
        boolean isCreator = expense.getCreatedBy().getId().equals(currentUserId);

        if (!isLeader && !isCreator) {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa khoản chi tiêu này. Chỉ người tạo hoặc Trưởng nhóm mới có quyền xóa.");
        }

        // Delete splits first (FK constraint)
        expenseSplitRepository.deleteByExpenseId(expenseId);
        expenseRepository.deleteById(expenseId);

        log.info("Đã xóa thành công khoản chi tiêu ID: {} khỏi chuyến đi ID: {}", expenseId, trip.getId());
    }

    private Map<Long, BigDecimal> computeSplits(BigDecimal totalAmount, SplitType splitType, List<ExpenseSplitRequest> splits, Long tripId) {
        log.debug("Tính toán chia tiền cho tổng số tiền: {} VND, hình thức: {}, số người chia: {}",
                totalAmount, splitType, splits != null ? splits.size() : 0);
        Map<Long, BigDecimal> result = new HashMap<>();

        for (ExpenseSplitRequest req : splits) {
            if (!tripMemberRepository.existsByTripIdAndUserId(tripId, req.getUserId())) {
                throw new UnauthorizedAccessException("Người tham gia chia tiền (ID: " + req.getUserId() + ") chưa tham gia chuyến đi này");
            }
        }

        int count = splits.size();

        if (splitType == SplitType.EQUAL) {
            BigDecimal baseAmount = totalAmount.divide(BigDecimal.valueOf(count), 2, RoundingMode.DOWN);
            BigDecimal remainder = totalAmount.subtract(baseAmount.multiply(BigDecimal.valueOf(count)));
            int cents = remainder.multiply(new BigDecimal("100")).intValue();

            for (int i = 0; i < count; i++) {
                Long userId = splits.get(i).getUserId();
                BigDecimal amountOwed = baseAmount;
                if (i < cents) {
                    amountOwed = amountOwed.add(new BigDecimal("0.01"));
                }
                result.put(userId, amountOwed);
            }
            log.debug("Hoàn tất tính chia đều EQUAL cho {} người dùng", count);
        } else if (splitType == SplitType.EXACT_AMOUNT) {
            BigDecimal totalSplitAmount = BigDecimal.ZERO;
            for (ExpenseSplitRequest req : splits) {
                if (req.getAmountOwed() == null || req.getAmountOwed().compareTo(BigDecimal.ZERO) < 0) {
                    throw new InvalidExpenseException("Số tiền chia cho từng cá nhân không được để trống hoặc nhỏ hơn 0");
                }
                totalSplitAmount = totalSplitAmount.add(req.getAmountOwed());
                result.put(req.getUserId(), req.getAmountOwed());
            }

            if (totalSplitAmount.compareTo(totalAmount) != 0) {
                log.warn("Tổng số tiền chia cụ thể ({}) không khớp với tổng hóa đơn ({})", totalSplitAmount, totalAmount);
                throw new InvalidExpenseException("Tổng số tiền chia cụ thể (" + totalSplitAmount
                        + " VND) không khớp với tổng hóa đơn (" + totalAmount + " VND)");
            }
            log.debug("Hoàn tất tính chia theo số tiền cụ thể EXACT_AMOUNT");
        }

        return result;
    }

    private ExpenseResponse mapToExpenseResponse(Expense expense, List<ExpenseSplit> splits) {
        List<ExpenseSplitResponse> splitResponses = splits.stream()
                .map(s -> ExpenseSplitResponse.builder()
                        .id(s.getId())
                        .userId(s.getUser().getId())
                        .userName(s.getUser().getFullName())
                        .amountOwed(s.getAmountOwed())
                        .build())
                .toList();

        PlannedExpenseCategory cat = expense.getCategory();

        return ExpenseResponse.builder()
                .id(expense.getId())
                .tripId(expense.getTrip().getId())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .isPaidByFund(expense.getIsPaidByFund())
                .payerId(expense.getPayer() != null ? expense.getPayer().getId() : null)
                .payerName(expense.getPayer() != null ? expense.getPayer().getFullName() : "Quỹ chung")
                .splitType(expense.getSplitType())
                .createdById(expense.getCreatedBy().getId())
                .createdByName(expense.getCreatedBy().getFullName())
                .createdAt(expense.getCreatedAt())
                .splits(splitResponses)
                .categoryId(cat != null ? cat.getId() : null)
                .categoryName(cat != null ? cat.getName() : null)
                .categoryIcon(cat != null ? cat.getIcon() : null)
                .categoryColor(cat != null ? cat.getColor() : null)
                .build();
    }
}
