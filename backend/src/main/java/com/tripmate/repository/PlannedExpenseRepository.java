package com.tripmate.repository;

import com.tripmate.entity.PlannedExpense;
import com.tripmate.enums.PlannedExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PlannedExpenseRepository extends JpaRepository<PlannedExpense, Long> {

    /**
     * Lấy danh sách planned expenses theo chuyến đi, sắp xếp mới nhất trước.
     */
    List<PlannedExpense> findByTripIdOrderByCreatedAtDesc(Long tripId);

    /**
     * Lấy danh sách theo trip + status cụ thể.
     */
    List<PlannedExpense> findByTripIdAndStatusOrderByCreatedAtDesc(Long tripId, PlannedExpenseStatus status);

    /**
     * Lấy danh sách theo trip + category.
     */
    List<PlannedExpense> findByTripIdAndCategoryIdOrderByCreatedAtDesc(Long tripId, Long categoryId);

    /**
     * Tính tổng estimated_amount theo trip (dùng cho Budget Summary).
     */
    @Query("SELECT COALESCE(SUM(pe.estimatedAmount), 0) FROM PlannedExpense pe WHERE pe.trip.id = :tripId")
    BigDecimal sumEstimatedAmountByTripId(@Param("tripId") Long tripId);

    /**
     * Tính tổng estimated_amount theo trip + payment source (phân tách FUND vs PERSONAL).
     */
    @Query("SELECT COALESCE(SUM(pe.estimatedAmount), 0) FROM PlannedExpense pe " +
           "WHERE pe.trip.id = :tripId AND pe.paymentSource = :paymentSource " +
           "AND pe.status NOT IN (com.tripmate.enums.PlannedExpenseStatus.CANCELLED)")
    BigDecimal sumEstimatedAmountByTripIdAndPaymentSource(
            @Param("tripId") Long tripId,
            @Param("paymentSource") com.tripmate.enums.PaymentSource paymentSource);
}
