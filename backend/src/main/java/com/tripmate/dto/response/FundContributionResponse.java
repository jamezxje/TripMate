package com.tripmate.dto.response;

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
public class FundContributionResponse {

    private Long id;
    private Long tripId;
    private Long userId;
    private String userName;
    private BigDecimal amount;
    private LocalDateTime createdAt;
}
