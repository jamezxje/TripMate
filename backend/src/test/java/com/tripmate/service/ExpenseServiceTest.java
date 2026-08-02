package com.tripmate.service;

import com.tripmate.dto.request.CreateExpenseRequest;
import com.tripmate.dto.request.ExpenseSplitRequest;
import com.tripmate.dto.response.ExpenseResponse;
import com.tripmate.entity.*;
import com.tripmate.enums.Role;
import com.tripmate.enums.SplitType;
import com.tripmate.enums.TripStatus;
import com.tripmate.exception.InsufficientFundException;
import com.tripmate.exception.InvalidExpenseException;
import com.tripmate.repository.*;
import com.tripmate.service.impl.ExpenseServiceImpl;
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
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private FundContributionRepository fundContributionRepository;

    @InjectMocks
    private ExpenseServiceImpl expenseService;

    private Trip mockTrip;
    private User mockUser1;
    private User mockUser2;
    private TripMember leaderMember;
    private TripMember regularMember;

    @BeforeEach
    void setUp() {
        mockTrip = Trip.builder().id(100L).name("Chuyến đi").status(TripStatus.PLANNING).build();
        mockUser1 = User.builder().id(1L).fullName("Nguyễn Văn A").email("a@test.com").build();
        mockUser2 = User.builder().id(2L).fullName("Trần Thị B").email("b@test.com").build();

        leaderMember = TripMember.builder().id(10L).trip(mockTrip).user(mockUser1).role(Role.LEADER).build();
        regularMember = TripMember.builder().id(11L).trip(mockTrip).user(mockUser2).role(Role.MEMBER).build();
    }

    @Test
    @DisplayName("createExpense - Chia đều (EQUAL) xử lý làm tròn chính xác từng đồng bằng BigDecimal")
    void createExpense_EqualSplit_Success() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Ăn trưa")
                .amount(new BigDecimal("100.00"))
                .splitType(SplitType.EQUAL)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(1L).build(),
                        ExpenseSplitRequest.builder().userId(2L).build(),
                        ExpenseSplitRequest.builder().userId(3L).build()
                ))
                .build();

        User mockUser3 = User.builder().id(3L).fullName("Lê C").build();

        Expense mockExpense = Expense.builder()
                .id(1L)
                .trip(mockTrip)
                .description("Ăn trưa")
                .amount(new BigDecimal("100.00"))
                .isPaidByFund(false)
                .payer(mockUser1)
                .splitType(SplitType.EQUAL)
                .createdBy(mockUser1)
                .createdAt(LocalDateTime.now())
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(mockUser2));
        when(userRepository.findById(3L)).thenReturn(Optional.of(mockUser3));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(leaderMember));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 1L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 2L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 3L)).thenReturn(true);
        when(expenseRepository.save(any(Expense.class))).thenReturn(mockExpense);

        ExpenseResponse response = expenseService.createExpense(request, 1L);

        assertNotNull(response);
        assertEquals(3, response.getSplits().size());

        // 100 / 3 = 33.33 each, remainder = 0.01 -> First person gets 33.34, others 33.33
        assertEquals(new BigDecimal("33.34"), response.getSplits().get(0).getAmountOwed());
        assertEquals(new BigDecimal("33.33"), response.getSplits().get(1).getAmountOwed());
        assertEquals(new BigDecimal("33.33"), response.getSplits().get(2).getAmountOwed());

        BigDecimal totalSum = response.getSplits().stream()
                .map(s -> s.getAmountOwed())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("100.00"), totalSum);
    }

    @Test
    @DisplayName("createExpense - Quỹ chung không đủ tiền -> Ném InsufficientFundException")
    void createExpense_InsufficientFund_ThrowsException() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Mua lều cắm trại")
                .amount(new BigDecimal("500000.00"))
                .isPaidByFund(true)
                .splitType(SplitType.EQUAL)
                .splits(List.of(ExpenseSplitRequest.builder().userId(1L).build()))
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser1));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(leaderMember));
        when(fundContributionRepository.sumAmountByTripId(100L)).thenReturn(new BigDecimal("200000.00"));
        when(expenseRepository.sumAmountPaidByFundByTripId(100L)).thenReturn(BigDecimal.ZERO);

        assertThrows(InsufficientFundException.class, () -> expenseService.createExpense(request, 1L));
    }

    @Test
    @DisplayName("createExpense - EXACT_AMOUNT tổng splits không bằng amount bill -> Ném InvalidExpenseException")
    void createExpense_ExactAmountMismatch_ThrowsException() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Ăn tối")
                .amount(new BigDecimal("500000.00"))
                .splitType(SplitType.EXACT_AMOUNT)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(1L).amountOwed(new BigDecimal("200000.00")).build(),
                        ExpenseSplitRequest.builder().userId(2L).amountOwed(new BigDecimal("200000.00")).build() // Total 400k != 500k
                ))
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser1));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(leaderMember));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 1L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 2L)).thenReturn(true);

        assertThrows(InvalidExpenseException.class, () -> expenseService.createExpense(request, 1L));
    }

    @Test
    @DisplayName("createExpense - Nếu user là MEMBER, bắt buộc ép payerId = currentUserId và isPaidByFund = false")
    void createExpense_MemberRole_EnforcesPayerAndNoFund() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Cà phê")
                .amount(new BigDecimal("50000.00"))
                .isPaidByFund(true) // Try to pay by fund as member
                .payerId(1L) // Try to set payer as user 1
                .splitType(SplitType.EQUAL)
                .splits(List.of(ExpenseSplitRequest.builder().userId(2L).build()))
                .build();

        Expense mockExpense = Expense.builder()
                .id(2L)
                .trip(mockTrip)
                .description("Cà phê")
                .amount(new BigDecimal("50000.00"))
                .isPaidByFund(false) // Should be enforced false
                .payer(mockUser2) // Should be enforced user 2 (currentUserId)
                .splitType(SplitType.EQUAL)
                .createdBy(mockUser2)
                .createdAt(LocalDateTime.now())
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(userRepository.findById(2L)).thenReturn(Optional.of(mockUser2));
        when(tripMemberRepository.findByTripIdAndUserId(100L, 2L)).thenReturn(Optional.of(regularMember));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 2L)).thenReturn(true);
        when(expenseRepository.save(any(Expense.class))).thenReturn(mockExpense);

        ExpenseResponse response = expenseService.createExpense(request, 2L);

        assertNotNull(response);
        assertFalse(response.getIsPaidByFund());
        assertEquals(2L, response.getPayerId());
    }
}
