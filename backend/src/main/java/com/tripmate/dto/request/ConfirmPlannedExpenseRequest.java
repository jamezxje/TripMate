package com.tripmate.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPlannedExpenseRequest {

    @NotNull(message = "Số tiền thực tế không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền thực tế phải lớn hơn 0")
    private BigDecimal actualAmount;
}
