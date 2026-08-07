package com.tripmate.service.impl;

import com.tripmate.dto.request.CreateItineraryActivityRequest;
import com.tripmate.dto.request.CreateItineraryDayRequest;
import com.tripmate.dto.request.UpdateItineraryActivityRequest;
import com.tripmate.dto.request.UpdateItineraryDayRequest;
import com.tripmate.dto.response.ItineraryActivityResponse;
import com.tripmate.dto.response.ItineraryDayResponse;
import com.tripmate.entity.ItineraryActivity;
import com.tripmate.entity.ItineraryDay;
import com.tripmate.entity.Trip;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.ItineraryActivityRepository;
import com.tripmate.repository.ItineraryDayRepository;
import com.tripmate.repository.TripMemberRepository;
import com.tripmate.repository.TripRepository;
import com.tripmate.service.ItineraryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItineraryServiceImpl implements ItineraryService {

    private final ItineraryDayRepository itineraryDayRepository;
    private final ItineraryActivityRepository itineraryActivityRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;

    private void validateTripMember(Long tripId, Long userId) {
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, userId)) {
            throw new UnauthorizedAccessException("Bạn không phải là thành viên của chuyến đi này");
        }
    }

    @Override
    public List<ItineraryDayResponse> getItinerary(Long tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId);
        }

        List<ItineraryDay> days = itineraryDayRepository.findByTripIdOrderByDayNumberAsc(tripId);
        return days.stream()
                .map(this::mapDayToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ItineraryDayResponse createDay(Long tripId, CreateItineraryDayRequest request, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        if (itineraryDayRepository.existsByTripIdAndDayNumber(tripId, request.getDayNumber())) {
            throw new IllegalArgumentException("Ngày thứ " + request.getDayNumber() + " đã tồn tại trong lịch trình");
        }

        ItineraryDay day = ItineraryDay.builder()
                .trip(trip)
                .dayNumber(request.getDayNumber())
                .date(request.getDate())
                .title(request.getTitle())
                .build();

        ItineraryDay saved = itineraryDayRepository.save(day);
        log.info("Tạo ngày thứ {} cho chuyến đi ID: {} thành công", saved.getDayNumber(), tripId);
        return mapDayToResponse(saved);
    }

    @Override
    @Transactional
    public ItineraryDayResponse updateDay(Long tripId, Long dayId, UpdateItineraryDayRequest request, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        ItineraryDay day = itineraryDayRepository.findById(dayId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ngày lịch trình với ID: " + dayId));

        if (!day.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("Ngày lịch trình không thuộc chuyến đi này");
        }

        if (request.getDayNumber() != null && !request.getDayNumber().equals(day.getDayNumber())) {
            if (itineraryDayRepository.existsByTripIdAndDayNumber(tripId, request.getDayNumber())) {
                throw new IllegalArgumentException("Ngày thứ " + request.getDayNumber() + " đã tồn tại");
            }
            day.setDayNumber(request.getDayNumber());
        }

        if (request.getDate() != null) {
            day.setDate(request.getDate());
        }

        if (request.getTitle() != null) {
            day.setTitle(request.getTitle());
        }

        ItineraryDay updated = itineraryDayRepository.save(day);
        log.info("Cập nhật ngày lịch trình ID: {} thành công", dayId);
        return mapDayToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteDay(Long tripId, Long dayId, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        ItineraryDay day = itineraryDayRepository.findById(dayId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ngày lịch trình với ID: " + dayId));

        if (!day.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("Ngày lịch trình không thuộc chuyến đi này");
        }

        itineraryDayRepository.delete(day);
        log.info("Xóa ngày lịch trình ID: {} thành công", dayId);
    }

    @Override
    @Transactional
    public ItineraryActivityResponse createActivity(Long tripId, Long dayId, CreateItineraryActivityRequest request, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        ItineraryDay day = itineraryDayRepository.findById(dayId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ngày lịch trình với ID: " + dayId));

        if (!day.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("Ngày lịch trình không thuộc chuyến đi này");
        }

        ItineraryActivity activity = ItineraryActivity.builder()
                .itineraryDay(day)
                .title(request.getTitle())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .mapsLink(request.getMapsLink())
                .notes(request.getNotes())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        ItineraryActivity saved = itineraryActivityRepository.save(activity);
        log.info("Tạo hoạt động '{}' thành công cho Day ID: {}", saved.getTitle(), dayId);
        return mapActivityToResponse(saved);
    }

    @Override
    @Transactional
    public ItineraryActivityResponse updateActivity(Long tripId, Long activityId, UpdateItineraryActivityRequest request, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        ItineraryActivity activity = itineraryActivityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hoạt động với ID: " + activityId));

        if (!activity.getItineraryDay().getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("Hoạt động không thuộc chuyến đi này");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            activity.setTitle(request.getTitle());
        }
        if (request.getStartTime() != null) {
            activity.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            activity.setEndTime(request.getEndTime());
        }
        if (request.getLocation() != null) {
            activity.setLocation(request.getLocation());
        }
        if (request.getMapsLink() != null) {
            activity.setMapsLink(request.getMapsLink());
        }
        if (request.getNotes() != null) {
            activity.setNotes(request.getNotes());
        }
        if (request.getSortOrder() != null) {
            activity.setSortOrder(request.getSortOrder());
        }

        ItineraryActivity updated = itineraryActivityRepository.save(activity);
        log.info("Cập nhật hoạt động ID: {} thành công", activityId);
        return mapActivityToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteActivity(Long tripId, Long activityId, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        ItineraryActivity activity = itineraryActivityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hoạt động với ID: " + activityId));

        if (!activity.getItineraryDay().getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("Hoạt động không thuộc chuyến đi này");
        }

        itineraryActivityRepository.delete(activity);
        log.info("Xóa hoạt động ID: {} thành công", activityId);
    }

    private ItineraryDayResponse mapDayToResponse(ItineraryDay day) {
        List<ItineraryActivityResponse> activities = day.getActivities().stream()
                .map(this::mapActivityToResponse)
                .collect(Collectors.toList());

        return ItineraryDayResponse.builder()
                .id(day.getId())
                .tripId(day.getTrip().getId())
                .dayNumber(day.getDayNumber())
                .date(day.getDate())
                .title(day.getTitle())
                .activities(activities)
                .createdAt(day.getCreatedAt())
                .build();
    }

    private ItineraryActivityResponse mapActivityToResponse(ItineraryActivity activity) {
        return ItineraryActivityResponse.builder()
                .id(activity.getId())
                .dayId(activity.getItineraryDay().getId())
                .title(activity.getTitle())
                .startTime(activity.getStartTime())
                .endTime(activity.getEndTime())
                .location(activity.getLocation())
                .mapsLink(activity.getMapsLink())
                .notes(activity.getNotes())
                .sortOrder(activity.getSortOrder())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
