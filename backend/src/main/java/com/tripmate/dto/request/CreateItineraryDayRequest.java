package com.tripmate.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateItineraryDayRequest {

    @NotNull(message = "Số thứ tự ngày không được để trống")
    @Positive(message = "Số thứ tự ngày phải lớn hơn 0")
    private Integer dayNumber;

    private LocalDate date;

    private String title;
}
