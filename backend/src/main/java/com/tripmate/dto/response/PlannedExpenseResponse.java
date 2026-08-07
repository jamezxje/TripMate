package com.tripmate.dto.response;

import com.tripmate.entity.PlannedExpense;
import com.tripmate.enums.PaymentSource;
import com.tripmate.enums.PlannedExpenseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlannedExpenseResponse {

    private Long id;
    private Long tripId;
    private String title;
    private ExpenseCategoryResponse category;
    private BigDecimal estimatedAmount;
    private PaymentSource paymentSource;
    private UserResponse responsiblePerson;
    private PlannedExpenseStatus status;
    private Long actualExpenseId;
    private String notes;
    private String bookingLink;
    private UserResponse createdBy;
    private LocalDateTime createdAt;

    public static PlannedExpenseResponse fromEntity(PlannedExpense pe) {
        if (pe == null) {
            return null;
        }
        return PlannedExpenseResponse.builder()
                .id(pe.getId())
                .tripId(pe.getTrip().getId())
                .title(pe.getTitle())
                .category(ExpenseCategoryResponse.fromEntity(pe.getCategory()))
                .estimatedAmount(pe.getEstimatedAmount())
                .paymentSource(pe.getPaymentSource())
                .responsiblePerson(UserResponse.fromEntity(pe.getResponsiblePerson()))
                .status(pe.getStatus())
                .actualExpenseId(pe.getActualExpense() != null ? pe.getActualExpense().getId() : null)
                .notes(pe.getNotes())
                .bookingLink(pe.getBookingLink())
                .createdBy(UserResponse.fromEntity(pe.getCreatedBy()))
                .createdAt(pe.getCreatedAt())
                .build();
    }
}
