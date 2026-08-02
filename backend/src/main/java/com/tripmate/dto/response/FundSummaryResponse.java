package com.tripmate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FundSummaryResponse {

    private Long tripId;
    private String tripName;
    private BigDecimal totalCollected;
    private BigDecimal totalSpentFromFund;
    private BigDecimal currentBalance;
    private List<FundContributionResponse> contributions;
}
