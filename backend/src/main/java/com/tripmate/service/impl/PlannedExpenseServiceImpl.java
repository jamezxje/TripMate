package com.tripmate.service.impl;

import com.tripmate.dto.request.ConfirmPlannedExpenseRequest;
import com.tripmate.dto.request.CreateExpenseRequest;
import com.tripmate.dto.request.CreatePlannedExpenseRequest;
import com.tripmate.dto.request.ExpenseSplitRequest;
import com.tripmate.dto.request.UpdatePlannedExpenseRequest;
import com.tripmate.dto.response.BudgetSummaryResponse;
import com.tripmate.dto.response.ExpenseResponse;
import com.tripmate.dto.response.FundSummaryResponse;
import com.tripmate.dto.response.PlannedExpenseResponse;
import com.tripmate.entity.PlannedExpense;
import com.tripmate.entity.PlannedExpenseCategory;
import com.tripmate.entity.Trip;
import com.tripmate.entity.TripMember;
import com.tripmate.entity.User;
import com.tripmate.entity.Expense;
import com.tripmate.enums.PaymentSource;
import com.tripmate.enums.PlannedExpenseStatus;
import com.tripmate.enums.Role;
import com.tripmate.enums.SplitType;
import com.tripmate.exception.InvalidExpenseException;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.ExpenseRepository;
import com.tripmate.repository.PlannedExpenseCategoryRepository;
import com.tripmate.repository.PlannedExpenseRepository;
import com.tripmate.repository.TripMemberRepository;
import com.tripmate.repository.TripRepository;
import com.tripmate.repository.UserRepository;
import com.tripmate.service.ExpenseService;
import com.tripmate.service.FundContributionService;
import com.tripmate.service.PlannedExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlannedExpenseServiceImpl implements PlannedExpenseService {

    private final PlannedExpenseRepository plannedExpenseRepository;
    private final PlannedExpenseCategoryRepository categoryRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;
    private final FundContributionService fundContributionService;
    private final ExpenseService expenseService;
    private final ExpenseRepository expenseRepository;

    private void validateTripMember(Long tripId, Long userId) {
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, userId)) {
            throw new UnauthorizedAccessException("Bạn không phải là thành viên của chuyến đi này");
        }
    }

    private TripMember getTripMember(Long tripId, Long userId) {
        return tripMemberRepository.findByTripIdAndUserId(tripId, userId)
                .orElseThrow(() -> new UnauthorizedAccessException("Bạn không phải là thành viên của chuyến đi này"));
    }

    @Override
    @Transactional
    public PlannedExpenseResponse createPlannedExpense(Long tripId, CreatePlannedExpenseRequest request, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi"));

        PlannedExpenseCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục chi tiêu"));

        User createdBy = userRepository.findById(currentUserId).orElseThrow();

        User responsiblePerson = null;
        if (request.getResponsiblePersonId() != null) {
            validateTripMember(tripId, request.getResponsiblePersonId());
            responsiblePerson = userRepository.findById(request.getResponsiblePersonId()).orElseThrow();
        }

        PlannedExpense plannedExpense = PlannedExpense.builder()
                .trip(trip)
                .title(request.getTitle())
                .category(category)
                .estimatedAmount(request.getEstimatedAmount())
                .paymentSource(request.getPaymentSource())
                .responsiblePerson(responsiblePerson)
                .notes(request.getNotes())
                .bookingLink(request.getBookingLink())
                .createdBy(createdBy)
                .status(PlannedExpenseStatus.PENDING)
                .build();

        PlannedExpense saved = plannedExpenseRepository.save(plannedExpense);
        return PlannedExpenseResponse.fromEntity(saved);
    }

    @Override
    public List<PlannedExpenseResponse> getPlannedExpenses(Long tripId, Long categoryId, String status) {
        if (!tripRepository.existsById(tripId)) {
            throw new ResourceNotFoundException("Không tìm thấy chuyến đi");
        }

        List<PlannedExpense> expenses;
        if (categoryId != null) {
            expenses = plannedExpenseRepository.findByTripIdAndCategoryIdOrderByCreatedAtDesc(tripId, categoryId);
        } else if (status != null) {
            try {
                PlannedExpenseStatus expStatus = PlannedExpenseStatus.valueOf(status.toUpperCase());
                expenses = plannedExpenseRepository.findByTripIdAndStatusOrderByCreatedAtDesc(tripId, expStatus);
            } catch (IllegalArgumentException e) {
                expenses = plannedExpenseRepository.findByTripIdOrderByCreatedAtDesc(tripId);
            }
        } else {
            expenses = plannedExpenseRepository.findByTripIdOrderByCreatedAtDesc(tripId);
        }

        // Apply additional filter if both provided (though repository method only handles one at a time currently, we can filter in memory)
        return expenses.stream()
                .filter(e -> (categoryId == null || e.getCategory().getId().equals(categoryId)))
                .filter(e -> (status == null || e.getStatus().name().equalsIgnoreCase(status)))
                .map(PlannedExpenseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PlannedExpenseResponse updatePlannedExpense(Long tripId, Long id, UpdatePlannedExpenseRequest request, Long currentUserId) {
        TripMember currentMember = getTripMember(tripId, currentUserId);
        PlannedExpense plannedExpense = plannedExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản dự trù"));

        if (!plannedExpense.getTrip().getId().equals(tripId)) {
            throw new InvalidExpenseException("Khoản dự trù không thuộc chuyến đi này");
        }

        if (currentMember.getRole() != Role.LEADER && !plannedExpense.getCreatedBy().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("Chỉ Leader hoặc người tạo mới được sửa khoản dự trù này");
        }

        if (request.getTitle() != null) plannedExpense.setTitle(request.getTitle());
        if (request.getCategoryId() != null) {
            PlannedExpenseCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
            plannedExpense.setCategory(category);
        }
        if (request.getEstimatedAmount() != null) plannedExpense.setEstimatedAmount(request.getEstimatedAmount());
        if (request.getPaymentSource() != null) plannedExpense.setPaymentSource(request.getPaymentSource());
        
        if (request.getResponsiblePersonId() != null) {
            validateTripMember(tripId, request.getResponsiblePersonId());
            User responsiblePerson = userRepository.findById(request.getResponsiblePersonId()).orElseThrow();
            plannedExpense.setResponsiblePerson(responsiblePerson);
        }

        if (request.getStatus() != null) {
            plannedExpense.setStatus(request.getStatus());
        }

        if (request.getNotes() != null) plannedExpense.setNotes(request.getNotes());
        if (request.getBookingLink() != null) plannedExpense.setBookingLink(request.getBookingLink());

        return PlannedExpenseResponse.fromEntity(plannedExpenseRepository.save(plannedExpense));
    }

    @Override
    @Transactional
    public void deletePlannedExpense(Long tripId, Long id, Long currentUserId) {
        TripMember currentMember = getTripMember(tripId, currentUserId);
        PlannedExpense plannedExpense = plannedExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản dự trù"));

        if (!plannedExpense.getTrip().getId().equals(tripId)) {
            throw new InvalidExpenseException("Khoản dự trù không thuộc chuyến đi này");
        }

        if (currentMember.getRole() != Role.LEADER && !plannedExpense.getCreatedBy().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("Chỉ Leader hoặc người tạo mới được xóa khoản dự trù này");
        }

        if (plannedExpense.getStatus() != PlannedExpenseStatus.PENDING) {
            throw new InvalidExpenseException("Chỉ có thể xóa khoản dự trù ở trạng thái PENDING (Chưa đặt)");
        }

        plannedExpenseRepository.delete(plannedExpense);
    }

    @Override
    @Transactional
    public PlannedExpenseResponse confirmPlannedExpense(Long tripId, Long id, ConfirmPlannedExpenseRequest request, Long currentUserId) {
        TripMember currentMember = getTripMember(tripId, currentUserId);
        PlannedExpense plannedExpense = plannedExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản dự trù"));

        if (!plannedExpense.getTrip().getId().equals(tripId)) {
            throw new InvalidExpenseException("Khoản dự trù không thuộc chuyến đi này");
        }

        boolean isResponsible = plannedExpense.getResponsiblePerson() != null && plannedExpense.getResponsiblePerson().getId().equals(currentUserId);
        if (currentMember.getRole() != Role.LEADER && !isResponsible) {
            throw new UnauthorizedAccessException("Chỉ Leader hoặc người phụ trách mới được xác nhận (Confirm)");
        }

        if (plannedExpense.getStatus() == PlannedExpenseStatus.CONFIRMED) {
            throw new InvalidExpenseException("Khoản dự trù này đã được xác nhận");
        }

        // Tạo chi tiêu thực tế (Expense) - Default: Split EQUAL to all members
        List<TripMember> allMembers = tripMemberRepository.findByTripId(tripId);
        List<ExpenseSplitRequest> splits = allMembers.stream()
                .map(tm -> new ExpenseSplitRequest(tm.getUser().getId(), null))
                .collect(Collectors.toList());

        CreateExpenseRequest createExpenseReq = CreateExpenseRequest.builder()
                .tripId(tripId)
                .description(plannedExpense.getTitle())
                .amount(request.getActualAmount())
                .isPaidByFund(plannedExpense.getPaymentSource() == PaymentSource.FUND)
                // Payer is current user if not paid by fund
                .payerId(plannedExpense.getPaymentSource() == PaymentSource.FUND ? null : currentUserId)
                .splitType(SplitType.EQUAL)
                .splits(splits)
                .build();

        ExpenseResponse expenseResponse = expenseService.createExpense(createExpenseReq, currentUserId);
        
        Expense actualExpense = expenseRepository.findById(expenseResponse.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Lỗi lấy thông tin chi tiêu thực tế"));

        plannedExpense.setActualExpense(actualExpense);
        plannedExpense.setStatus(PlannedExpenseStatus.CONFIRMED);

        return PlannedExpenseResponse.fromEntity(plannedExpenseRepository.save(plannedExpense));
    }

    @Override
    public BudgetSummaryResponse getBudgetSummary(Long tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new ResourceNotFoundException("Không tìm thấy chuyến đi");
        }

        FundSummaryResponse fundSummary = fundContributionService.getFundSummary(tripId);
        BigDecimal totalFund = fundSummary.getCurrentBalance();
        BigDecimal totalEstimated = plannedExpenseRepository.sumEstimatedAmountByTripId(tripId);
        BigDecimal totalFundEstimated = plannedExpenseRepository.sumEstimatedAmountByTripIdAndPaymentSource(tripId, PaymentSource.FUND);

        List<PlannedExpenseCategory> allCategories = categoryRepository.findAllOrderByDefaultFirst();
        
        List<BudgetSummaryResponse.CategoryBreakdown> breakdowns = allCategories.stream().map(cat -> {
            BigDecimal catTotal = plannedExpenseRepository.findByTripIdAndCategoryIdOrderByCreatedAtDesc(tripId, cat.getId())
                    .stream()
                    .filter(e -> e.getStatus() != PlannedExpenseStatus.CANCELLED)
                    .map(PlannedExpense::getEstimatedAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
            return BudgetSummaryResponse.CategoryBreakdown.builder()
                    .category(com.tripmate.dto.response.ExpenseCategoryResponse.fromEntity(cat))
                    .amount(catTotal)
                    .build();
        }).filter(b -> b.getAmount().compareTo(BigDecimal.ZERO) > 0).collect(Collectors.toList());

        return BudgetSummaryResponse.builder()
                .totalFund(totalFund)
                .totalEstimated(totalEstimated)
                .totalFundEstimated(totalFundEstimated)
                .breakdown(breakdowns)
                .build();
    }
}
