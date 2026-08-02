package com.tripmate.repository;

import com.tripmate.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByTripId(Long tripId);

    List<Expense> findByTripIdOrderByCreatedAtDesc(Long tripId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.trip.id = :tripId AND e.isPaidByFund = true")
    BigDecimal sumAmountPaidByFundByTripId(@Param("tripId") Long tripId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.trip.id = :tripId AND e.isPaidByFund = false AND e.payer.id = :userId")
    BigDecimal sumAmountPaidByPayerId(@Param("tripId") Long tripId, @Param("userId") Long userId);
}
