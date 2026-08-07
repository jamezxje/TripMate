package com.tripmate.service;

import com.tripmate.dto.request.ConfirmPlannedExpenseRequest;
import com.tripmate.dto.request.CreatePlannedExpenseRequest;
import com.tripmate.dto.request.UpdatePlannedExpenseRequest;
import com.tripmate.dto.response.BudgetSummaryResponse;
import com.tripmate.dto.response.PlannedExpenseResponse;

import java.util.List;

public interface PlannedExpenseService {

    PlannedExpenseResponse createPlannedExpense(Long tripId, CreatePlannedExpenseRequest request, Long currentUserId);

    List<PlannedExpenseResponse> getPlannedExpenses(Long tripId, Long categoryId, String status);

    PlannedExpenseResponse updatePlannedExpense(Long tripId, Long id, UpdatePlannedExpenseRequest request, Long currentUserId);

    void deletePlannedExpense(Long tripId, Long id, Long currentUserId);

    PlannedExpenseResponse confirmPlannedExpense(Long tripId, Long id, ConfirmPlannedExpenseRequest request, Long currentUserId);

    BudgetSummaryResponse getBudgetSummary(Long tripId);
}
