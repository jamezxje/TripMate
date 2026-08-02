package com.tripmate.service;

import com.tripmate.dto.response.SettlementSummaryResponse;
import com.tripmate.dto.response.SuggestedTransferDTO;
import com.tripmate.entity.*;
import com.tripmate.enums.Role;
import com.tripmate.enums.TripStatus;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.*;
import com.tripmate.service.impl.SettlementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FundContributionRepository fundContributionRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @InjectMocks
    private SettlementServiceImpl settlementService;

    private Trip mockTrip;
    private User mockUser1;
    private User mockUser2;
    private TripMember leaderMember;
    private TripMember regularMember;

    @BeforeEach
    void setUp() {
        mockTrip = Trip.builder().id(100L).name("Chuyến đi").status(TripStatus.ONGOING).build();
        mockUser1 = User.builder().id(1L).fullName("Nguyễn Văn A").email("a@test.com").build();
        mockUser2 = User.builder().id(2L).fullName("Trần Thị B").email("b@test.com").build();

        leaderMember = TripMember.builder().id(10L).trip(mockTrip).user(mockUser1).role(Role.LEADER).build();
        regularMember = TripMember.builder().id(11L).trip(mockTrip).user(mockUser2).role(Role.MEMBER).build();
    }

    @Test
    @DisplayName("getSettlementSummary - Thuật toán Greedy khớp nối bù trừ tối ưu nhất giữa Debtor và Creditor")
    void getSettlementSummary_GreedyOptimization_Success() {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(tripMemberRepository.findByTripId(100L)).thenReturn(List.of(leaderMember, regularMember));

        // User 1 paid out of pocket 400k, spent 200k -> Net Balance +200k (Creditor)
        when(fundContributionRepository.sumAmountByTripIdAndUserId(100L, 1L)).thenReturn(BigDecimal.ZERO);
        when(expenseRepository.sumAmountPaidByPayerId(100L, 1L)).thenReturn(new BigDecimal("400000.00"));
        when(expenseSplitRepository.sumAmountOwedByTripIdAndUserId(100L, 1L)).thenReturn(new BigDecimal("200000.00"));

        // User 2 paid out of pocket 0k, spent 200k -> Net Balance -200k (Debtor)
        when(fundContributionRepository.sumAmountByTripIdAndUserId(100L, 2L)).thenReturn(BigDecimal.ZERO);
        when(expenseRepository.sumAmountPaidByPayerId(100L, 2L)).thenReturn(BigDecimal.ZERO);
        when(expenseSplitRepository.sumAmountOwedByTripIdAndUserId(100L, 2L)).thenReturn(new BigDecimal("200000.00"));

        when(settlementRepository.findByTripId(100L)).thenReturn(new ArrayList<>());

        Settlement mockSavedSettlement = Settlement.builder()
                .id(1L)
                .trip(mockTrip)
                .fromUser(mockUser2)
                .toUser(mockUser1)
                .amount(new BigDecimal("200000.00"))
                .isSettled(false)
                .build();

        when(settlementRepository.save(any(Settlement.class))).thenReturn(mockSavedSettlement);

        SettlementSummaryResponse summary = settlementService.getSettlementSummary(100L);

        assertNotNull(summary);
        assertEquals(2, summary.getBalances().size());
        assertEquals(new BigDecimal("200000.00"), summary.getBalances().get(0).getNetBalance());
        assertEquals(new BigDecimal("-200000.00"), summary.getBalances().get(1).getNetBalance());

        verify(settlementRepository, times(1)).save(any(Settlement.class));
    }

    @Test
    @DisplayName("completeSettlement - Leader đánh dấu hoàn tất và tự động chuyển Trip sang CLOSED khi hoàn tất toàn bộ")
    void completeSettlement_ClosesTrip_WhenAllSettled() {
        Settlement settlement = Settlement.builder()
                .id(1L)
                .trip(mockTrip)
                .fromUser(mockUser2)
                .toUser(mockUser1)
                .amount(new BigDecimal("200000.00"))
                .isSettled(false)
                .build();

        when(settlementRepository.findById(1L)).thenReturn(Optional.of(settlement));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(leaderMember));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(settlementRepository.existsByTripIdAndIsSettledFalse(100L)).thenReturn(false);

        SuggestedTransferDTO dto = settlementService.completeSettlement(1L, 1L);

        assertNotNull(dto);
        assertTrue(dto.getIsSettled());
        assertEquals(TripStatus.CLOSED, mockTrip.getStatus());
        verify(tripRepository, times(1)).save(mockTrip);
    }

    @Test
    @DisplayName("completeSettlement - Member thường bấm hoàn tất -> Ném UnauthorizedAccessException")
    void completeSettlement_RegularMember_ThrowsException() {
        Settlement settlement = Settlement.builder()
                .id(1L)
                .trip(mockTrip)
                .fromUser(mockUser2)
                .toUser(mockUser1)
                .amount(new BigDecimal("200000.00"))
                .isSettled(false)
                .build();

        when(settlementRepository.findById(1L)).thenReturn(Optional.of(settlement));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 2L)).thenReturn(Optional.of(regularMember));

        assertThrows(UnauthorizedAccessException.class, () -> settlementService.completeSettlement(1L, 2L));
    }
}
