package com.tripmate.controller;

import com.tripmate.dto.request.ConfirmPlannedExpenseRequest;
import com.tripmate.dto.request.CreatePlannedExpenseRequest;
import com.tripmate.dto.request.UpdatePlannedExpenseRequest;
import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.BudgetSummaryResponse;
import com.tripmate.dto.response.PlannedExpenseResponse;
import com.tripmate.security.SecurityUtils;
import com.tripmate.service.PlannedExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/trips/{tripId}")
@RequiredArgsConstructor
public class PlannedExpenseController {

    private final PlannedExpenseService plannedExpenseService;

    private Long getCurrentUserId(Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        return currentUserId;
    }

    @PostMapping("/planned-expenses")
    public ResponseEntity<ApiResponse<PlannedExpenseResponse>> createPlannedExpense(
            @PathVariable Long tripId,
            @Valid @RequestBody CreatePlannedExpenseRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API POST /api/v1/trips/{}/planned-expenses - Tạo khoản dự trù", tripId);
        PlannedExpenseResponse response = plannedExpenseService.createPlannedExpense(tripId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khoản dự trù thành công", response));
    }

    @GetMapping("/planned-expenses")
    public ResponseEntity<ApiResponse<List<PlannedExpenseResponse>>> getPlannedExpenses(
            @PathVariable Long tripId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status) {
        log.info("API GET /api/v1/trips/{}/planned-expenses - Lấy danh sách dự trù", tripId);
        List<PlannedExpenseResponse> response = plannedExpenseService.getPlannedExpenses(tripId, categoryId, status);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khoản dự trù thành công", response));
    }

    @PutMapping("/planned-expenses/{id}")
    public ResponseEntity<ApiResponse<PlannedExpenseResponse>> updatePlannedExpense(
            @PathVariable Long tripId,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlannedExpenseRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API PUT /api/v1/trips/{}/planned-expenses/{} - Cập nhật khoản dự trù", tripId, id);
        PlannedExpenseResponse response = plannedExpenseService.updatePlannedExpense(tripId, id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khoản dự trù thành công", response));
    }

    @DeleteMapping("/planned-expenses/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlannedExpense(
            @PathVariable Long tripId,
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API DELETE /api/v1/trips/{}/planned-expenses/{} - Xóa khoản dự trù", tripId, id);
        plannedExpenseService.deletePlannedExpense(tripId, id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xóa khoản dự trù thành công", null));
    }

    @PostMapping("/planned-expenses/{id}/confirm")
    public ResponseEntity<ApiResponse<PlannedExpenseResponse>> confirmPlannedExpense(
            @PathVariable Long tripId,
            @PathVariable Long id,
            @Valid @RequestBody ConfirmPlannedExpenseRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API POST /api/v1/trips/{}/planned-expenses/{}/confirm - Xác nhận khoản dự trù", tripId, id);
        PlannedExpenseResponse response = plannedExpenseService.confirmPlannedExpense(tripId, id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận khoản dự trù thành công", response));
    }

    @GetMapping("/budget-summary")
    public ResponseEntity<ApiResponse<BudgetSummaryResponse>> getBudgetSummary(
            @PathVariable Long tripId) {
        log.info("API GET /api/v1/trips/{}/budget-summary - Lấy tổng quan ngân sách", tripId);
        BudgetSummaryResponse response = plannedExpenseService.getBudgetSummary(tripId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tổng quan ngân sách thành công", response));
    }
}
