package com.tripmate.repository;

import com.tripmate.entity.ChecklistItem;
import com.tripmate.enums.ChecklistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {

    List<ChecklistItem> findByTripIdOrderBySortOrderAscCreatedAtAsc(Long tripId);

    long countByTripId(Long tripId);

    long countByTripIdAndStatus(Long tripId, ChecklistStatus status);
}
