package com.tripmate.dto.response;

import com.tripmate.enums.ChecklistStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemResponse {

    private Long id;
    private Long tripId;
    private String title;
    private String description;
    
    private Long assigneeId;
    private String assigneeName;
    private Boolean assigneeIsGuest;
    
    private ChecklistStatus status;
    private LocalDate dueDate;
    private Integer sortOrder;
    
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
}
