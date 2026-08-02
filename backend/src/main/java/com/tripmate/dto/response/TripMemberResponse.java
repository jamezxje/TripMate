package com.tripmate.dto.response;

import com.tripmate.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripMemberResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private Role role;
    private boolean isGuest;
}
