package com.tripmate.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TripStatus {
    PLANNING("Lên kế hoạch"),
    ONGOING("Đang diễn ra"),
    SETTLED("Đã quyết toán xong"),
    CLOSED("Đã đóng");

    private final String description;
}
