package com.tripmate.dto.response;

import com.tripmate.entity.PlannedExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseCategoryResponse {

    private Long id;
    private String name;
    private String icon;
    private String color;
    private boolean isDefault;

    public static ExpenseCategoryResponse fromEntity(PlannedExpenseCategory category) {
        if (category == null) {
            return null;
        }
        return ExpenseCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .isDefault(category.isDefault())
                .build();
    }
}
