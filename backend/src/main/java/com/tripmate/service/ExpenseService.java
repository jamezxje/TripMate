package com.tripmate.service;

import com.tripmate.dto.request.CreateExpenseRequest;
import com.tripmate.dto.request.UpdateExpenseRequest;
import com.tripmate.dto.response.ExpenseResponse;

import java.util.List;

public interface ExpenseService {

    ExpenseResponse createExpense(CreateExpenseRequest request, Long currentUserId);

    List<ExpenseResponse> getExpensesByTripId(Long tripId);

    ExpenseResponse updateExpense(Long expenseId, UpdateExpenseRequest request, Long currentUserId);

    void deleteExpense(Long expenseId, Long currentUserId);
}
