package com.tripmate.dto.request;

import com.tripmate.enums.ChecklistStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateChecklistItemRequest {

    @NotBlank(message = "Tên công việc không được để trống")
    @Size(max = 255, message = "Tên công việc không được vượt quá 255 ký tự")
    private String title;

    private String description;

    private Long assigneeId;

    private ChecklistStatus status = ChecklistStatus.TODO;

    private LocalDate dueDate;

    private Integer sortOrder = 0;
}
