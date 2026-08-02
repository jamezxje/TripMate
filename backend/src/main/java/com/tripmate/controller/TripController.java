package com.tripmate.controller;

import com.tripmate.dto.request.CreateGuestRequest;
import com.tripmate.dto.request.CreateTripRequest;
import com.tripmate.dto.request.JoinTripRequest;
import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.TripMemberResponse;
import com.tripmate.dto.response.TripResponse;
import com.tripmate.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.tripmate.security.SecurityUtils;

@Slf4j
@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    public ResponseEntity<ApiResponse<TripResponse>> createTrip(
            @Valid @RequestBody CreateTripRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API POST /api/v1/trips - Tạo chuyến đi mới: '{}', thực hiện bởi người dùng ID: {}",
                request.getName(), currentUserId);
        TripResponse response = tripService.createTrip(request, currentUserId);
        log.info("API POST /api/v1/trips - Tạo chuyến đi thành công với ID: {}, Mã tham gia: {}",
                response.getId(), response.getJoinCode());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chuyến đi thành công", response));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<TripResponse>> joinTrip(
            @Valid @RequestBody JoinTripRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API POST /api/v1/trips/join - Tham gia chuyến đi với mã: '{}', bởi người dùng ID: {}",
                request.getJoinCode(), currentUserId);
        TripResponse response = tripService.joinTrip(request, currentUserId);
        log.info("API POST /api/v1/trips/join - Gia nhập chuyến đi ID: '{}' thành công", response.getId());
        return ResponseEntity
                .ok(ApiResponse.success("Gia nhập chuyến đi thành công", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<java.util.List<TripResponse>>> getMyTrips(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API GET /api/v1/trips/me - Lấy danh sách chuyến đi của user ID: {}", currentUserId);
        java.util.List<TripResponse> response = tripService.getUserTrips(currentUserId);
        log.info("API GET /api/v1/trips/me - Lấy thành công {} chuyến đi", response.size());
        return ResponseEntity
                .ok(ApiResponse.success("Lấy danh sách chuyến đi thành công", response));
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<ApiResponse<TripResponse>> getTripDetail(
            @PathVariable Long tripId,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API GET /api/v1/trips/{} - Lấy thông tin chi tiết chuyến đi bởi user ID: {}", tripId, currentUserId);
        TripResponse response = tripService.getTripDetail(tripId, currentUserId);
        log.info("API GET /api/v1/trips/{} - Lấy thành công chi tiết chuyến đi '{}' (Số thành viên: {})",
                tripId, response.getName(), response.getMembers() != null ? response.getMembers().size() : 0);
        return ResponseEntity
                .ok(ApiResponse.success("Lấy thông tin chuyến đi thành công", response));
    }

    @PostMapping("/{tripId}/guests")
    public ResponseEntity<ApiResponse<TripMemberResponse>> addGuestMember(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateGuestRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = (headerUserId != null) ? headerUserId : 1L;
        }
        log.info("API POST /api/v1/trips/{}/guests - Thêm thành viên ảo '{}' bởi user ID: {}", tripId, request.getFullName(), currentUserId);
        TripMemberResponse response = tripService.addGuestMember(tripId, request, currentUserId);
        log.info("API POST /api/v1/trips/{}/guests - Thêm thành viên ảo thành công ID: {}", tripId, response.getUserId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm thành viên ảo thành công", response));
    }
}
