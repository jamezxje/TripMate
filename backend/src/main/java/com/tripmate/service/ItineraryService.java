package com.tripmate.service;

import com.tripmate.dto.request.CreateItineraryActivityRequest;
import com.tripmate.dto.request.CreateItineraryDayRequest;
import com.tripmate.dto.request.UpdateItineraryActivityRequest;
import com.tripmate.dto.request.UpdateItineraryDayRequest;
import com.tripmate.dto.response.ItineraryActivityResponse;
import com.tripmate.dto.response.ItineraryDayResponse;

import java.util.List;

public interface ItineraryService {

    List<ItineraryDayResponse> getItinerary(Long tripId);

    ItineraryDayResponse createDay(Long tripId, CreateItineraryDayRequest request, Long currentUserId);

    ItineraryDayResponse updateDay(Long tripId, Long dayId, UpdateItineraryDayRequest request, Long currentUserId);

    void deleteDay(Long tripId, Long dayId, Long currentUserId);

    ItineraryActivityResponse createActivity(Long tripId, Long dayId, CreateItineraryActivityRequest request, Long currentUserId);

    ItineraryActivityResponse updateActivity(Long tripId, Long activityId, UpdateItineraryActivityRequest request, Long currentUserId);

    void deleteActivity(Long tripId, Long activityId, Long currentUserId);
}
