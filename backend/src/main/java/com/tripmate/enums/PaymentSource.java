package com.tripmate.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentSource {
    FUND("Quỹ chung"),
    PERSONAL("Cá nhân tự trả");

    private final String description;
}
