package com.tripmate.dto.response;

import com.tripmate.enums.SplitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {

    private Long id;
    private Long tripId;
    private String description;
    private BigDecimal amount;
    private Boolean isPaidByFund;
    private Long payerId;
    private String payerName;
    private SplitType splitType;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private List<ExpenseSplitResponse> splits;
}
