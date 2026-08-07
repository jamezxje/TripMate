package com.tripmate.controller;

import com.tripmate.dto.request.CreateChecklistItemRequest;
import com.tripmate.dto.request.UpdateChecklistItemRequest;
import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.ChecklistItemResponse;
import com.tripmate.dto.response.ChecklistSummaryResponse;
import com.tripmate.enums.ChecklistStatus;
import com.tripmate.security.SecurityUtils;
import com.tripmate.service.ChecklistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/trips/{tripId}/checklist")
@RequiredArgsConstructor
public class ChecklistController {

    private final ChecklistService checklistService;

    private Long getCurrentUserId(Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        return currentUserId;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ChecklistSummaryResponse>> getChecklist(
            @PathVariable Long tripId) {
        log.info("API GET /api/v1/trips/{}/checklist - Lấy danh sách việc cần làm", tripId);
        ChecklistSummaryResponse response = checklistService.getChecklist(tripId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách việc cần làm thành công", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChecklistItemResponse>> createChecklistItem(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateChecklistItemRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API POST /api/v1/trips/{}/checklist - Tạo công việc mới", tripId);
        ChecklistItemResponse response = checklistService.createChecklistItem(tripId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo công việc mới thành công", response));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ChecklistItemResponse>> updateChecklistItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateChecklistItemRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API PUT /api/v1/trips/{}/checklist/{} - Cập nhật công việc", tripId, itemId);
        ChecklistItemResponse response = checklistService.updateChecklistItem(tripId, itemId, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật công việc thành công", response));
    }

    @PatchMapping("/{itemId}/status")
    public ResponseEntity<ApiResponse<ChecklistItemResponse>> updateStatus(
            @PathVariable Long tripId,
            @PathVariable Long itemId,
            @RequestParam ChecklistStatus status,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API PATCH /api/v1/trips/{}/checklist/{}/status?status={} - Đổi trạng thái", tripId, itemId, status);
        ChecklistItemResponse response = checklistService.updateStatus(tripId, itemId, status, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", response));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteChecklistItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API DELETE /api/v1/trips/{}/checklist/{} - Xóa công việc", tripId, itemId);
        checklistService.deleteChecklistItem(tripId, itemId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xóa công việc thành công", null));
    }
}
