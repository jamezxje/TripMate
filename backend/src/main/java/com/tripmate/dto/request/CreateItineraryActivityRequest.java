package com.tripmate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalTime;

@Data
public class CreateItineraryActivityRequest {

    @NotBlank(message = "Tên hoạt động không được để trống")
    @Size(max = 255, message = "Tên hoạt động không vượt quá 255 ký tự")
    private String title;

    private LocalTime startTime;

    private LocalTime endTime;

    private String location;

    @Size(max = 500, message = "Liên kết Google Maps không được vượt quá 500 ký tự")
    private String mapsLink;

    private String notes;

    private Integer sortOrder = 0;
}
