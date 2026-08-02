package com.tripmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripmate.dto.request.FundContributionRequest;
import com.tripmate.dto.response.FundContributionResponse;
import com.tripmate.dto.response.FundSummaryResponse;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.service.FundContributionService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.tripmate.security.CustomUserDetailsService;
import com.tripmate.security.JwtTokenProvider;

@WebMvcTest(FundContributionController.class)
@AutoConfigureMockMvc(addFilters = false)
class FundContributionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FundContributionService fundContributionService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private FundContributionResponse mockContributionResponse;
    private FundSummaryResponse mockSummaryResponse;

    @BeforeEach
    void setUp() {
        mockContributionResponse = FundContributionResponse.builder()
                .id(1L)
                .tripId(100L)
                .userId(1L)
                .userName("Nguyễn Văn A")
                .amount(new BigDecimal("500000.00"))
                .createdAt(LocalDateTime.now())
                .build();

        mockSummaryResponse = FundSummaryResponse.builder()
                .tripId(100L)
                .tripName("Chuyến đi Đà Nẵng")
                .totalCollected(new BigDecimal("1000000.00"))
                .totalSpentFromFund(new BigDecimal("300000.00"))
                .currentBalance(new BigDecimal("700000.00"))
                .contributions(List.of(mockContributionResponse))
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/funds - Đóng quỹ thành công (HTTP 201)")
    void contributeToFund_Success() throws Exception {
        FundContributionRequest request = FundContributionRequest.builder()
                .tripId(100L)
                .userId(1L)
                .amount(new BigDecimal("500000.00"))
                .build();

        when(fundContributionService.contributeToFund(any(FundContributionRequest.class)))
                .thenReturn(mockContributionResponse);

        mockMvc.perform(post("/api/v1/funds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Ghi nhận đóng quỹ thành công"))
                .andExpect(jsonPath("$.data.amount").value(500000.00))
                .andExpect(jsonPath("$.data.userName").value("Nguyễn Văn A"));
    }

    @Test
    @DisplayName("POST /api/v1/funds - Số tiền <= 0 -> Lỗi Validation (HTTP 400)")
    void contributeToFund_InvalidAmount_BadRequest() throws Exception {
        FundContributionRequest request = FundContributionRequest.builder()
                .tripId(100L)
                .userId(1L)
                .amount(new BigDecimal("0.00"))
                .build();

        mockMvc.perform(post("/api/v1/funds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.details.amount").exists());
    }

    @Test
    @DisplayName("GET /api/v1/trips/{tripId}/funds - Xem tổng quan quỹ thành công (HTTP 200)")
    void getFundSummary_Success() throws Exception {
        when(fundContributionService.getFundSummary(100L)).thenReturn(mockSummaryResponse);

        mockMvc.perform(get("/api/v1/trips/100/funds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalCollected").value(1000000.00))
                .andExpect(jsonPath("$.data.totalSpentFromFund").value(300000.00))
                .andExpect(jsonPath("$.data.currentBalance").value(700000.00));
    }

    @Test
    @DisplayName("GET /api/v1/trips/{tripId}/funds - Không tìm thấy tripId -> HTTP 404 Not Found")
    void getFundSummary_NotFound() throws Exception {
        when(fundContributionService.getFundSummary(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: 999"));

        mockMvc.perform(get("/api/v1/trips/999/funds"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Không tìm thấy chuyến đi với ID: 999"));
    }
}
