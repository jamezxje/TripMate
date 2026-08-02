package com.tripmate.service;

import com.tripmate.dto.request.CreateExpenseRequest;
import com.tripmate.dto.request.ExpenseSplitRequest;
import com.tripmate.dto.response.ExpenseResponse;
import com.tripmate.entity.*;
import com.tripmate.enums.Role;
import com.tripmate.enums.SplitType;
import com.tripmate.enums.TripStatus;
import com.tripmate.exception.InsufficientFundException;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.*;
import com.tripmate.service.impl.ExpenseServiceImpl;
import com.tripmate.service.impl.SettlementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EdgeCasesValidationTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FundContributionRepository fundContributionRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @InjectMocks
    private ExpenseServiceImpl expenseService;

    @InjectMocks
    private SettlementServiceImpl settlementService;

    private Trip mockTrip;
    private User user1;
    private User user2;
    private User user3;
    private TripMember leaderMember;
    private TripMember regularMember2;
    private TripMember regularMember3;

    @BeforeEach
    void setUp() {
        mockTrip = Trip.builder().id(100L).name("Chuyến đi Hà Giang").status(TripStatus.ONGOING).build();

        user1 = User.builder().id(1L).fullName("User 1").email("u1@test.com").build();
        user2 = User.builder().id(2L).fullName("User 2").email("u2@test.com").build();
        user3 = User.builder().id(3L).fullName("User 3").email("u3@test.com").build();

        leaderMember = TripMember.builder().id(10L).trip(mockTrip).user(user1).role(Role.LEADER).build();
        regularMember2 = TripMember.builder().id(11L).trip(mockTrip).user(user2).role(Role.MEMBER).build();
        regularMember3 = TripMember.builder().id(12L).trip(mockTrip).user(user3).role(Role.MEMBER).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(userRepository.findById(3L)).thenReturn(Optional.of(user3));
    }

    @Test
    @DisplayName("Edge Case 1: Chia tiền lẻ 100.000đ cho 3 người -> Tổng tiền 3 phần chia phải KHỚP 100% 100.000,00đ")
    void equalSplit_FractionalAmount_SumMatchesExactly() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Ăn trưa lẻ 100k")
                .amount(new BigDecimal("100000.00"))
                .isPaidByFund(false)
                .payerId(1L)
                .splitType(SplitType.EQUAL)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(1L).build(),
                        ExpenseSplitRequest.builder().userId(2L).build(),
                        ExpenseSplitRequest.builder().userId(3L).build()
                ))
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(leaderMember));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 1L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 2L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 3L)).thenReturn(true);

        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense e = invocation.getArgument(0);
            e.setId(99L);
            return e;
        });

        ExpenseResponse response = expenseService.createExpense(request, 1L);

        assertNotNull(response);
        assertEquals(3, response.getSplits().size());

        // Verify the sum of the 3 splits equals 100,000.00 exactly
        BigDecimal totalSplitsSum = response.getSplits().stream()
                .map(s -> s.getAmountOwed())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(new BigDecimal("100000.00"), totalSplitsSum, "Tổng các phần chia tiền lẻ phải khớp đúng 100.000,00đ!");
    }

    @Test
    @DisplayName("Edge Case 2: Chi tiêu vượt quá số dư Quỹ chung -> Ném InsufficientFundException")
    void createExpense_OverspendingFund_ThrowsInsufficientFundException() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Khách sạn resort 5 sao")
                .amount(new BigDecimal("5000000.00"))
                .isPaidByFund(true)
                .splitType(SplitType.EQUAL)
                .splits(List.of(ExpenseSplitRequest.builder().userId(1L).build()))
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(leaderMember));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 1L)).thenReturn(true);

        // Fund collected: 1,000,000 VND, Spent: 400,000 VND -> Current balance = 600,000 VND < 5,000,000 VND required
        when(fundContributionRepository.sumAmountByTripId(100L)).thenReturn(new BigDecimal("1000000.00"));
        when(expenseRepository.sumAmountPaidByFundByTripId(100L)).thenReturn(new BigDecimal("400000.00"));

        assertThrows(InsufficientFundException.class, () -> expenseService.createExpense(request, 1L));
    }

    @Test
    @DisplayName("Edge Case 3: Bảo mật Phân quyền - MEMBER cố chọn người khác trả hoặc chọn quỹ chung -> Hệ thống ghi đè an toàn")
    void createExpense_MemberRoleOverride_EnforcesPayerAsSelfAndNoFund() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Thuê xe máy")
                .amount(new BigDecimal("200000.00"))
                .isPaidByFund(true) // Member attempts to use group fund!
                .payerId(1L) // Member attempts to set Leader as payer!
                .splitType(SplitType.EQUAL)
                .splits(List.of(ExpenseSplitRequest.builder().userId(2L).build()))
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 2L)).thenReturn(Optional.of(regularMember2));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 2L)).thenReturn(true);

        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense e = invocation.getArgument(0);
            e.setId(88L);
            return e;
        });

        ExpenseResponse response = expenseService.createExpense(request, 2L);

        assertNotNull(response);
        assertFalse(response.getIsPaidByFund(), "MEMBER không được quyền sử dụng quỹ chung!");
        assertEquals(2L, response.getPayerId(), "MEMBER bị bắt buộc ép payerId = chính mình!");
    }

    @Test
    @DisplayName("Edge Case 4: Bảo mật Quyết toán - MEMBER thường cố bấm hoàn tất chuyển tiền -> Ném UnauthorizedAccessException")
    void completeSettlement_MemberRole_ThrowsUnauthorizedAccessException() {
        Settlement settlement = Settlement.builder()
                .id(50L)
                .trip(mockTrip)
                .fromUser(user2)
                .toUser(user1)
                .amount(new BigDecimal("100000.00"))
                .isSettled(false)
                .build();

        when(settlementRepository.findById(50L)).thenReturn(Optional.of(settlement));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 2L)).thenReturn(Optional.of(regularMember2));

        assertThrows(UnauthorizedAccessException.class, () -> settlementService.completeSettlement(50L, 2L));
    }
}
