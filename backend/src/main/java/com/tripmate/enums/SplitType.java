package com.tripmate.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SplitType {
    EQUAL("Chia đều"),
    EXACT_AMOUNT("Chia theo số tiền cụ thể");

    private final String description;
}
