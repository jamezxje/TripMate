package com.tripmate.dto.response;

import com.tripmate.enums.TripStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripResponse {

    private Long id;
    private String name;
    private TripStatus status;
    private String joinCode;
    private LocalDateTime createdAt;
    private List<TripMemberResponse> members;
}
