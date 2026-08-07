package com.tripmate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistSummaryResponse {

    private long totalItems;
    private long completedItems;
    private long inProgressItems;
    private long todoItems;
    private double completionPercentage;
    private List<ChecklistItemResponse> items;
}
