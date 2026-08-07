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
public class BudgetSummaryResponse {

    private BigDecimal totalFund;
    private BigDecimal totalEstimated;
    private BigDecimal totalFundEstimated;
    private List<CategoryBreakdown> breakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBreakdown {
        private ExpenseCategoryResponse category;
        private BigDecimal amount;
    }
}
