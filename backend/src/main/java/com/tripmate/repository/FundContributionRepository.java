package com.tripmate.repository;

import com.tripmate.entity.FundContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FundContributionRepository extends JpaRepository<FundContribution, Long> {

    List<FundContribution> findByTripId(Long tripId);

    List<FundContribution> findByTripIdAndUserId(Long tripId, Long userId);

    @Query("SELECT COALESCE(SUM(fc.amount), 0) FROM FundContribution fc WHERE fc.trip.id = :tripId")
    BigDecimal sumAmountByTripId(@Param("tripId") Long tripId);

    @Query("SELECT COALESCE(SUM(fc.amount), 0) FROM FundContribution fc WHERE fc.trip.id = :tripId AND fc.user.id = :userId")
    BigDecimal sumAmountByTripIdAndUserId(@Param("tripId") Long tripId, @Param("userId") Long userId);
}
