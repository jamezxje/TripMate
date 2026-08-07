package com.tripmate.dto.request;

import com.tripmate.enums.PaymentSource;
import com.tripmate.enums.PlannedExpenseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePlannedExpenseRequest {

    private String title;

    private Long categoryId;

    private BigDecimal estimatedAmount;

    private PaymentSource paymentSource;

    private Long responsiblePersonId;

    private PlannedExpenseStatus status;

    private String notes;

    private String bookingLink;
}
