package com.tripmate.controller;

import com.tripmate.dto.request.FundContributionRequest;
import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.FundContributionResponse;
import com.tripmate.dto.response.FundSummaryResponse;
import com.tripmate.service.FundContributionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FundContributionController {

    private final FundContributionService fundContributionService;

    @PostMapping("/funds")
    public ResponseEntity<ApiResponse<FundContributionResponse>> contributeToFund(
            @Valid @RequestBody FundContributionRequest request) {
        log.info("API POST /api/v1/funds - Ghi nhận đóng quỹ, chuyến đi ID: {}, người dùng ID: {}, số tiền: {}",
                request.getTripId(), request.getUserId(), request.getAmount());
        
        FundContributionResponse response = fundContributionService.contributeToFund(request);
        
        log.info("API POST /api/v1/funds - Ghi nhận đóng quỹ thành công với ID đóng quỹ: {}", response.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ghi nhận đóng quỹ thành công", response));
    }

    @GetMapping("/trips/{tripId}/funds")
    public ResponseEntity<ApiResponse<FundSummaryResponse>> getFundSummary(
            @PathVariable Long tripId) {
        log.info("API GET /api/v1/trips/{}/funds - Lấy thông tin tổng quan quỹ của chuyến đi", tripId);
        
        FundSummaryResponse response = fundContributionService.getFundSummary(tripId);
        
        log.info("API GET /api/v1/trips/{}/funds - Lấy thông tin quỹ thành công. Tổng thu: {}, Đã chi từ quỹ: {}, Còn lại: {}",
                tripId, response.getTotalCollected(), response.getTotalSpentFromFund(), response.getCurrentBalance());
        return ResponseEntity
                .ok(ApiResponse.success("Lấy thông tin tổng quan quỹ thành công", response));
    }
}
