package com.tripmate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryDayResponse {

    private Long id;
    private Long tripId;
    private Integer dayNumber;
    private LocalDate date;
    private String title;
    private List<ItineraryActivityResponse> activities;
    private LocalDateTime createdAt;
}
