package com.tripmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripmate.dto.request.CreateExpenseRequest;
import com.tripmate.dto.request.ExpenseSplitRequest;
import com.tripmate.dto.response.ExpenseResponse;
import com.tripmate.dto.response.ExpenseSplitResponse;
import com.tripmate.enums.SplitType;
import com.tripmate.exception.InsufficientFundException;
import com.tripmate.exception.InvalidExpenseException;
import com.tripmate.service.ExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.tripmate.security.CustomUserDetailsService;
import com.tripmate.security.JwtTokenProvider;

@WebMvcTest(ExpenseController.class)
@AutoConfigureMockMvc(addFilters = false)
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ExpenseService expenseService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private ExpenseResponse mockExpenseResponse;

    @BeforeEach
    void setUp() {
        ExpenseSplitResponse split1 = ExpenseSplitResponse.builder()
                .id(1L)
                .userId(1L)
                .userName("Nguyễn Văn A")
                .amountOwed(new BigDecimal("50000.00"))
                .build();

        ExpenseSplitResponse split2 = ExpenseSplitResponse.builder()
                .id(2L)
                .userId(2L)
                .userName("Trần Thị B")
                .amountOwed(new BigDecimal("50000.00"))
                .build();

        mockExpenseResponse = ExpenseResponse.builder()
                .id(10L)
                .tripId(100L)
                .description("Ăn trưa hải sản")
                .amount(new BigDecimal("100000.00"))
                .isPaidByFund(false)
                .payerId(1L)
                .payerName("Nguyễn Văn A")
                .splitType(SplitType.EQUAL)
                .createdById(1L)
                .createdByName("Nguyễn Văn A")
                .createdAt(LocalDateTime.now())
                .splits(List.of(split1, split2))
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/expenses - Tạo khoản chi tiêu thành công (HTTP 201)")
    void createExpense_Success() throws Exception {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Ăn trưa hải sản")
                .amount(new BigDecimal("100000.00"))
                .isPaidByFund(false)
                .payerId(1L)
                .splitType(SplitType.EQUAL)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(1L).build(),
                        ExpenseSplitRequest.builder().userId(2L).build()
                ))
                .build();

        when(expenseService.createExpense(any(CreateExpenseRequest.class), eq(1L)))
                .thenReturn(mockExpenseResponse);

        mockMvc.perform(post("/api/v1/expenses")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Tạo khoản chi tiêu thành công"))
                .andExpect(jsonPath("$.data.description").value("Ăn trưa hải sản"))
                .andExpect(jsonPath("$.data.amount").value(100000.00));
    }

    @Test
    @DisplayName("POST /api/v1/expenses - Quỹ chung không đủ tiền -> HTTP 400 Bad Request")
    void createExpense_InsufficientFund_BadRequest() throws Exception {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Mua đồ dùng chung")
                .amount(new BigDecimal("1000000.00"))
                .isPaidByFund(true)
                .splitType(SplitType.EQUAL)
                .splits(List.of(ExpenseSplitRequest.builder().userId(1L).build()))
                .build();

        when(expenseService.createExpense(any(CreateExpenseRequest.class), eq(1L)))
                .thenThrow(new InsufficientFundException("Số dư quỹ chung không đủ để thực hiện giao dịch này"));

        mockMvc.perform(post("/api/v1/expenses")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Số dư quỹ chung không đủ để thực hiện giao dịch này"));
    }

    @Test
    @DisplayName("POST /api/v1/expenses - Chia tiền lẻ không khớp bill -> HTTP 400 Bad Request")
    void createExpense_InvalidSplitSum_BadRequest() throws Exception {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .tripId(100L)
                .description("Karaoke")
                .amount(new BigDecimal("500000.00"))
                .splitType(SplitType.EXACT_AMOUNT)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(1L).amountOwed(new BigDecimal("200000.00")).build(),
                        ExpenseSplitRequest.builder().userId(2L).amountOwed(new BigDecimal("200000.00")).build()
                ))
                .build();

        when(expenseService.createExpense(any(CreateExpenseRequest.class), eq(1L)))
                .thenThrow(new InvalidExpenseException("Tổng số tiền chia cụ thể không khớp với tổng hóa đơn"));

        mockMvc.perform(post("/api/v1/expenses")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Tổng số tiền chia cụ thể không khớp với tổng hóa đơn"));
    }

    @Test
    @DisplayName("GET /api/v1/trips/{tripId}/expenses - Lấy danh sách chi tiêu thành công (HTTP 200)")
    void getExpensesByTripId_Success() throws Exception {
        when(expenseService.getExpensesByTripId(100L)).thenReturn(List.of(mockExpenseResponse));

        mockMvc.perform(get("/api/v1/trips/100/expenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(10))
                .andExpect(jsonPath("$.data[0].description").value("Ăn trưa hải sản"));
    }
}
