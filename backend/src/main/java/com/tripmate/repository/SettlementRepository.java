package com.tripmate.repository;

import com.tripmate.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    List<Settlement> findByTripId(Long tripId);

    void deleteByTripId(Long tripId);

    boolean existsByTripIdAndIsSettledFalse(Long tripId);
}
