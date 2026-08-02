package com.tripmate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinTripRequest {

    @NotBlank(message = "Mã tham gia không được để trống")
    private String joinCode;
}
