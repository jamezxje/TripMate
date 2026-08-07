package com.tripmate.repository;

import com.tripmate.entity.ItineraryActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryActivityRepository extends JpaRepository<ItineraryActivity, Long> {

    List<ItineraryActivity> findByItineraryDayIdOrderBySortOrderAscStartTimeAsc(Long dayId);
}
