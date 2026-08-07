package com.tripmate.repository;

import com.tripmate.entity.ItineraryDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItineraryDayRepository extends JpaRepository<ItineraryDay, Long> {

    List<ItineraryDay> findByTripIdOrderByDayNumberAsc(Long tripId);

    Optional<ItineraryDay> findByTripIdAndDayNumber(Long tripId, Integer dayNumber);

    boolean existsByTripIdAndDayNumber(Long tripId, Integer dayNumber);
}
