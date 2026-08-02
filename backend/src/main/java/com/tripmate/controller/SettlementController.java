package com.tripmate.controller;

import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.SettlementSummaryResponse;
import com.tripmate.dto.response.SuggestedTransferDTO;
import com.tripmate.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.tripmate.security.SecurityUtils;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @GetMapping("/trips/{tripId}/settlements")
    public ResponseEntity<ApiResponse<SettlementSummaryResponse>> getSettlementSummary(
            @PathVariable Long tripId) {
        log.info("API GET /api/v1/trips/{}/settlements - Lấy thông tin quyết toán của chuyến đi", tripId);
        
        SettlementSummaryResponse response = settlementService.getSettlementSummary(tripId);
        
        log.info("API GET /api/v1/trips/{}/settlements - Lấy thông tin thành công. Số giao dịch đề xuất: {}", 
                tripId, response.getSuggestedTransfers() != null ? response.getSuggestedTransfers().size() : 0);
        return ResponseEntity
                .ok(ApiResponse.success("Lấy thông tin quyết toán thành công", response));
    }

    @PatchMapping("/settlements/{id}/complete")
    public ResponseEntity<ApiResponse<SuggestedTransferDTO>> completeSettlement(
            @PathVariable("id") Long settlementId,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API PATCH /api/v1/settlements/{}/complete - Đánh dấu hoàn tất chuyển tiền, thực hiện bởi người dùng ID: {}",
                settlementId, currentUserId);
        
        SuggestedTransferDTO response = settlementService.completeSettlement(settlementId, currentUserId);
        
        log.info("API PATCH /api/v1/settlements/{}/complete - Hoàn tất chuyển tiền thành công. Trạng thái đã quyết toán: {}",
                settlementId, response.getIsSettled());
        return ResponseEntity
                .ok(ApiResponse.success("Đánh dấu hoàn tất chuyển tiền thành công", response));
    }
}
