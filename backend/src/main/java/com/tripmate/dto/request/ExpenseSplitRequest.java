package com.tripmate.dto.request;

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
public class ExpenseSplitRequest {

    @NotNull(message = "ID người dùng tham gia chia tiền không được để trống")
    private Long userId;

    private BigDecimal amountOwed;
}
