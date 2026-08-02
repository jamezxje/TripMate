package com.tripmate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    private boolean success;
    private int status;
    private String message;
    private Map<String, String> details;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static ErrorResponse of(int status, String message) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ErrorResponse of(int status, String message, Map<String, String> details) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .message(message)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
