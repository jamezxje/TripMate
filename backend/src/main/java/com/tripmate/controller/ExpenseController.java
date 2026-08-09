package com.tripmate.controller;

import com.tripmate.dto.request.CreateExpenseRequest;
import com.tripmate.dto.request.UpdateExpenseRequest;
import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.ExpenseResponse;
import com.tripmate.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.tripmate.security.SecurityUtils;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping("/expenses")
    public ResponseEntity<ApiResponse<ExpenseResponse>> createExpense(
            @Valid @RequestBody CreateExpenseRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API POST /api/v1/expenses - Tạo khoản chi tiêu: '{}', số tiền: {}, chuyến đi ID: {}, bởi người dùng ID: {}",
                request.getDescription(), request.getAmount(), request.getTripId(), currentUserId);

        ExpenseResponse response = expenseService.createExpense(request, currentUserId);

        log.info("API POST /api/v1/expenses - Tạo khoản chi tiêu thành công với ID: {}", response.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khoản chi tiêu thành công", response));
    }

    @GetMapping("/trips/{tripId}/expenses")
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getExpensesByTripId(
            @PathVariable Long tripId) {
        log.info("API GET /api/v1/trips/{}/expenses - Lấy danh sách chi tiêu của chuyến đi", tripId);

        List<ExpenseResponse> response = expenseService.getExpensesByTripId(tripId);

        log.info("API GET /api/v1/trips/{}/expenses - Lấy thành công {} khoản chi tiêu", tripId, response.size());
        return ResponseEntity
                .ok(ApiResponse.success("Lấy danh sách chi tiêu thành công", response));
    }

    @PutMapping("/expenses/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> updateExpense(
            @PathVariable Long expenseId,
            @Valid @RequestBody UpdateExpenseRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API PUT /api/v1/expenses/{} - Cập nhật khoản chi tiêu bởi người dùng ID: {}", expenseId, currentUserId);

        ExpenseResponse response = expenseService.updateExpense(expenseId, request, currentUserId);

        log.info("API PUT /api/v1/expenses/{} - Cập nhật thành công", expenseId);
        return ResponseEntity
                .ok(ApiResponse.success("Cập nhật khoản chi tiêu thành công", response));
    }

    @DeleteMapping("/expenses/{expenseId}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            @PathVariable Long expenseId,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API DELETE /api/v1/expenses/{} - Xóa khoản chi tiêu bởi người dùng ID: {}", expenseId, currentUserId);

        expenseService.deleteExpense(expenseId, currentUserId);

        log.info("API DELETE /api/v1/expenses/{} - Xóa thành công", expenseId);
        return ResponseEntity
                .ok(ApiResponse.success("Xóa khoản chi tiêu thành công", null));
    }
}
