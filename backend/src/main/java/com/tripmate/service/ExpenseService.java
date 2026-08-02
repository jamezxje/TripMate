package com.tripmate.service;

import com.tripmate.dto.request.CreateExpenseRequest;
import com.tripmate.dto.response.ExpenseResponse;

import java.util.List;

public interface ExpenseService {

    ExpenseResponse createExpense(CreateExpenseRequest request, Long currentUserId);

    List<ExpenseResponse> getExpensesByTripId(Long tripId);
}
