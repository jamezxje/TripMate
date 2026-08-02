package com.tripmate.service;

import com.tripmate.dto.request.FundContributionRequest;
import com.tripmate.dto.response.FundContributionResponse;
import com.tripmate.dto.response.FundSummaryResponse;
import com.tripmate.entity.FundContribution;
import com.tripmate.entity.Trip;
import com.tripmate.entity.User;
import com.tripmate.enums.TripStatus;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.*;
import com.tripmate.service.impl.FundContributionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FundContributionServiceTest {

    @Mock
    private FundContributionRepository fundContributionRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @InjectMocks
    private FundContributionServiceImpl fundContributionService;

    private Trip mockTrip;
    private User mockUser;
    private FundContribution mockContribution;

    @BeforeEach
    void setUp() {
        mockTrip = Trip.builder()
                .id(100L)
                .name("Chuyến đi Đà Nẵng")
                .status(TripStatus.PLANNING)
                .build();

        mockUser = User.builder()
                .id(1L)
                .email("anv@example.com")
                .fullName("Nguyễn Văn A")
                .build();

        mockContribution = FundContribution.builder()
                .id(10L)
                .trip(mockTrip)
                .user(mockUser)
                .amount(new BigDecimal("500000.00"))
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("contributeToFund - Ghi nhận đóng quỹ thành công")
    void contributeToFund_Success() {
        FundContributionRequest request = FundContributionRequest.builder()
                .tripId(100L)
                .userId(1L)
                .amount(new BigDecimal("500000.00"))
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 1L)).thenReturn(true);
        when(fundContributionRepository.save(any(FundContribution.class))).thenReturn(mockContribution);

        FundContributionResponse response = fundContributionService.contributeToFund(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("500000.00"), response.getAmount());
        assertEquals("Nguyễn Văn A", response.getUserName());
        verify(fundContributionRepository, times(1)).save(any(FundContribution.class));
    }

    @Test
    @DisplayName("contributeToFund - Người dùng chưa tham gia trip -> Ném UnauthorizedAccessException")
    void contributeToFund_NotMember_ThrowsException() {
        FundContributionRequest request = FundContributionRequest.builder()
                .tripId(100L)
                .userId(2L)
                .amount(new BigDecimal("500000.00"))
                .build();

        User nonMemberUser = User.builder().id(2L).fullName("Trần B").build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(userRepository.findById(2L)).thenReturn(Optional.of(nonMemberUser));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 2L)).thenReturn(false);

        assertThrows(UnauthorizedAccessException.class, () -> fundContributionService.contributeToFund(request));
    }

    @Test
    @DisplayName("getFundSummary - Tính toán chính xác tổng thu, tổng chi từ quỹ và số dư")
    void getFundSummary_Success() {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(fundContributionRepository.sumAmountByTripId(100L)).thenReturn(new BigDecimal("1000000.00"));
        when(expenseRepository.sumAmountPaidByFundByTripId(100L)).thenReturn(new BigDecimal("400000.00"));
        when(fundContributionRepository.findByTripId(100L)).thenReturn(List.of(mockContribution));

        FundSummaryResponse summary = fundContributionService.getFundSummary(100L);

        assertNotNull(summary);
        assertEquals(new BigDecimal("1000000.00"), summary.getTotalCollected());
        assertEquals(new BigDecimal("400000.00"), summary.getTotalSpentFromFund());
        assertEquals(new BigDecimal("600000.00"), summary.getCurrentBalance());
        assertEquals(1, summary.getContributions().size());
    }
}
