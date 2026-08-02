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
public class FundContributionRequest {

    @NotNull(message = "ID chuyến đi không được để trống")
    private Long tripId;

    private Long userId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền đóng quỹ phải lớn hơn 0")
    private BigDecimal amount;
}
