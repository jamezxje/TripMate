package com.tripmate.controller;

import com.tripmate.dto.request.CreateItineraryActivityRequest;
import com.tripmate.dto.request.CreateItineraryDayRequest;
import com.tripmate.dto.request.UpdateItineraryActivityRequest;
import com.tripmate.dto.request.UpdateItineraryDayRequest;
import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.ItineraryActivityResponse;
import com.tripmate.dto.response.ItineraryDayResponse;
import com.tripmate.security.SecurityUtils;
import com.tripmate.service.ItineraryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/trips/{tripId}/itinerary")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    private Long getCurrentUserId(Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        return currentUserId;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ItineraryDayResponse>>> getItinerary(
            @PathVariable Long tripId) {
        log.info("API GET /api/v1/trips/{}/itinerary - Lấy lịch trình chuyến đi", tripId);
        List<ItineraryDayResponse> response = itineraryService.getItinerary(tripId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch trình chuyến đi thành công", response));
    }

    @PostMapping("/days")
    public ResponseEntity<ApiResponse<ItineraryDayResponse>> createDay(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateItineraryDayRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API POST /api/v1/trips/{}/itinerary/days - Thêm ngày mới", tripId);
        ItineraryDayResponse response = itineraryService.createDay(tripId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm ngày lịch trình thành công", response));
    }

    @PutMapping("/days/{dayId}")
    public ResponseEntity<ApiResponse<ItineraryDayResponse>> updateDay(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @Valid @RequestBody UpdateItineraryDayRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API PUT /api/v1/trips/{}/itinerary/days/{} - Cập nhật ngày lịch trình", tripId, dayId);
        ItineraryDayResponse response = itineraryService.updateDay(tripId, dayId, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ngày lịch trình thành công", response));
    }

    @DeleteMapping("/days/{dayId}")
    public ResponseEntity<ApiResponse<Void>> deleteDay(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API DELETE /api/v1/trips/{}/itinerary/days/{} - Xóa ngày lịch trình", tripId, dayId);
        itineraryService.deleteDay(tripId, dayId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xóa ngày lịch trình thành công", null));
    }

    @PostMapping("/days/{dayId}/activities")
    public ResponseEntity<ApiResponse<ItineraryActivityResponse>> createActivity(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @Valid @RequestBody CreateItineraryActivityRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API POST /api/v1/trips/{}/itinerary/days/{}/activities - Thêm hoạt động", tripId, dayId);
        ItineraryActivityResponse response = itineraryService.createActivity(tripId, dayId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm hoạt động lịch trình thành công", response));
    }

    @PutMapping("/activities/{activityId}")
    public ResponseEntity<ApiResponse<ItineraryActivityResponse>> updateActivity(
            @PathVariable Long tripId,
            @PathVariable Long activityId,
            @Valid @RequestBody UpdateItineraryActivityRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API PUT /api/v1/trips/{}/itinerary/activities/{} - Cập nhật hoạt động", tripId, activityId);
        ItineraryActivityResponse response = itineraryService.updateActivity(tripId, activityId, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hoạt động thành công", response));
    }

    @DeleteMapping("/activities/{activityId}")
    public ResponseEntity<ApiResponse<Void>> deleteActivity(
            @PathVariable Long tripId,
            @PathVariable Long activityId,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = getCurrentUserId(headerUserId);
        log.info("API DELETE /api/v1/trips/{}/itinerary/activities/{} - Xóa hoạt động", tripId, activityId);
        itineraryService.deleteActivity(tripId, activityId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xóa hoạt động thành công", null));
    }
}
