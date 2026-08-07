package com.tripmate.dto.request;

import com.tripmate.enums.PaymentSource;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePlannedExpenseRequest {

    @NotBlank(message = "Tên khoản dự trù không được để trống")
    private String title;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotNull(message = "Số tiền dự trù không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền dự trù phải lớn hơn 0")
    private BigDecimal estimatedAmount;

    @NotNull(message = "Nguồn thanh toán không được để trống")
    private PaymentSource paymentSource;

    private Long responsiblePersonId;

    private String notes;

    private String bookingLink;
}
