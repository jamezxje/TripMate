package com.tripmate.dto.request;

import com.tripmate.enums.SplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpenseRequest {

    @NotNull(message = "ID chuyến đi không được để trống")
    private Long tripId;

    @NotBlank(message = "Mô tả khoản chi không được để trống")
    private String description;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền chi phải lớn hơn 0")
    private BigDecimal amount;

    private Boolean isPaidByFund;

    private Long payerId;

    @NotNull(message = "Loại chia tiền không được để trống")
    private SplitType splitType;

    @NotEmpty(message = "Danh sách người tham gia chia tiền không được để trống")
    @Valid
    private List<ExpenseSplitRequest> splits;
}
