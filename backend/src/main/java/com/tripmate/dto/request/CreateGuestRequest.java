package com.tripmate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateGuestRequest {
    @NotBlank(message = "Tên thành viên ảo không được để trống")
    private String fullName;
}
