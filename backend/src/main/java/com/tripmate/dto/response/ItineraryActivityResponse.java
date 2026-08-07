package com.tripmate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryActivityResponse {

    private Long id;
    private Long dayId;
    private String title;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String mapsLink;
    private String notes;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
