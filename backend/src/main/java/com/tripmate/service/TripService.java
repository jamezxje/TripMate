package com.tripmate.service;

import com.tripmate.dto.request.CreateTripRequest;
import com.tripmate.dto.request.JoinTripRequest;
import com.tripmate.dto.response.TripResponse;

public interface TripService {

    TripResponse createTrip(CreateTripRequest request, Long currentUserId);

    TripResponse joinTrip(JoinTripRequest request, Long currentUserId);

    TripResponse getTripDetail(Long tripId, Long currentUserId);

    java.util.List<TripResponse> getUserTrips(Long currentUserId);

    com.tripmate.dto.response.TripMemberResponse addGuestMember(Long tripId, com.tripmate.dto.request.CreateGuestRequest request, Long currentUserId);
}
