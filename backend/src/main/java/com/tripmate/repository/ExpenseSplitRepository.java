package com.tripmate.repository;

import com.tripmate.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    List<ExpenseSplit> findByExpenseId(Long expenseId);

    List<ExpenseSplit> findByUserId(Long userId);

    void deleteByExpenseId(Long expenseId);

    @Query("SELECT COALESCE(SUM(es.amountOwed), 0) FROM ExpenseSplit es JOIN es.expense e WHERE e.trip.id = :tripId AND es.user.id = :userId")
    BigDecimal sumAmountOwedByTripIdAndUserId(@Param("tripId") Long tripId, @Param("userId") Long userId);
}
