package com.tripmate.service.impl;

import com.tripmate.dto.request.FundContributionRequest;
import com.tripmate.dto.response.FundContributionResponse;
import com.tripmate.dto.response.FundSummaryResponse;
import com.tripmate.entity.FundContribution;
import com.tripmate.entity.Trip;
import com.tripmate.entity.User;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.*;
import com.tripmate.service.FundContributionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FundContributionServiceImpl implements FundContributionService {

    private final FundContributionRepository fundContributionRepository;
    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;

    @Override
    @Transactional
    public FundContributionResponse contributeToFund(FundContributionRequest request) {
        log.info("Bắt đầu ghi nhận đóng quỹ cho chuyến đi ID: {}, số tiền: {} VND", request.getTripId(), request.getAmount());

        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + request.getTripId()));

        Long contributorId = request.getUserId();
        if (contributorId == null) {
            contributorId = com.tripmate.security.SecurityUtils.getRequiredCurrentUserId();
        }

        final Long targetUserId = contributorId;
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + targetUserId));

        boolean isMember = tripMemberRepository.existsByTripIdAndUserId(trip.getId(), user.getId());
        if (!isMember) {
            log.warn("Thất bại khi đóng quỹ: Người dùng ID {} chưa tham gia chuyến đi ID {}", user.getId(), trip.getId());
            throw new UnauthorizedAccessException("Người dùng chưa tham gia chuyến đi này");
        }

        FundContribution contribution = FundContribution.builder()
                .trip(trip)
                .user(user)
                .amount(request.getAmount())
                .build();

        FundContribution saved = fundContributionRepository.save(contribution);
        log.info("Đóng quỹ thành công cho chuyến đi ID: {}, ID bản ghi đóng quỹ: {}, người đóng ID: {}",
                trip.getId(), saved.getId(), user.getId());

        return FundContributionResponse.builder()
                .id(saved.getId())
                .tripId(trip.getId())
                .userId(user.getId())
                .userName(user.getFullName())
                .amount(saved.getAmount())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    public FundSummaryResponse getFundSummary(Long tripId) {
        log.info("Tính toán tổng quan quỹ cho chuyến đi ID: {}", tripId);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        BigDecimal totalCollected = fundContributionRepository.sumAmountByTripId(tripId);
        if (totalCollected == null) {
            totalCollected = BigDecimal.ZERO;
        }

        BigDecimal totalSpentFromFund = expenseRepository.sumAmountPaidByFundByTripId(tripId);
        if (totalSpentFromFund == null) {
            totalSpentFromFund = BigDecimal.ZERO;
        }

        BigDecimal currentBalance = totalCollected.subtract(totalSpentFromFund);
        log.info("Tổng quan quỹ chuyến đi '{}' (ID: {}): Đã thu = {}, Đã chi = {}, Dư = {}",
                trip.getName(), tripId, totalCollected, totalSpentFromFund, currentBalance);

        List<FundContribution> contributions = fundContributionRepository.findByTripId(tripId);
        List<FundContributionResponse> contributionResponses = contributions.stream()
                .map(c -> FundContributionResponse.builder()
                        .id(c.getId())
                        .tripId(c.getTrip().getId())
                        .userId(c.getUser().getId())
                        .userName(c.getUser().getFullName())
                        .amount(c.getAmount())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();

        return FundSummaryResponse.builder()
                .tripId(trip.getId())
                .tripName(trip.getName())
                .totalCollected(totalCollected)
                .totalSpentFromFund(totalSpentFromFund)
                .currentBalance(currentBalance)
                .contributions(contributionResponses)
                .build();
    }
}
