package com.tripmate.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateItineraryDayRequest {

    private Integer dayNumber;

    private LocalDate date;

    private String title;
}
