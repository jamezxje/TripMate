package com.tripmate.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PlannedExpenseStatus {
    PENDING("Chưa đặt"),
    BOOKED("Đã đặt"),
    CONFIRMED("Đã xác nhận"),
    CANCELLED("Đã hủy");

    private final String description;
}
