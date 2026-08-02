package com.tripmate.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {
    LEADER("Trưởng nhóm"),
    MEMBER("Thành viên"),
    GUEST("Khách");

    private final String description;
}
