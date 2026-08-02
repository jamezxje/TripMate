package com.tripmate.controller;

import com.tripmate.dto.response.SettlementSummaryResponse;
import com.tripmate.dto.response.SuggestedTransferDTO;
import com.tripmate.dto.response.UserBalanceDTO;
import com.tripmate.enums.TripStatus;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.service.SettlementService;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.tripmate.security.CustomUserDetailsService;
import com.tripmate.security.JwtTokenProvider;

@WebMvcTest(SettlementController.class)
@AutoConfigureMockMvc(addFilters = false)
class SettlementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SettlementService settlementService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private SettlementSummaryResponse mockSummaryResponse;
    private SuggestedTransferDTO mockTransferDTO;

    @BeforeEach
    void setUp() {
        UserBalanceDTO b1 = UserBalanceDTO.builder()
                .userId(1L)
                .fullName("Nguyễn Văn A")
                .email("a@test.com")
                .totalFundContributed(new BigDecimal("500000.00"))
                .totalPaidOutOfPocket(new BigDecimal("200000.00"))
                .totalAmountOwed(new BigDecimal("300000.00"))
                .netBalance(new BigDecimal("400000.00"))
                .build();

        UserBalanceDTO b2 = UserBalanceDTO.builder()
                .userId(2L)
                .fullName("Trần Thị B")
                .email("b@test.com")
                .totalFundContributed(new BigDecimal("0.00"))
                .totalPaidOutOfPocket(new BigDecimal("0.00"))
                .totalAmountOwed(new BigDecimal("400000.00"))
                .netBalance(new BigDecimal("-400000.00"))
                .build();

        mockTransferDTO = SuggestedTransferDTO.builder()
                .id(10L)
                .fromUserId(2L)
                .fromUserName("Trần Thị B")
                .toUserId(1L)
                .toUserName("Nguyễn Văn A")
                .amount(new BigDecimal("400000.00"))
                .isSettled(false)
                .build();

        mockSummaryResponse = SettlementSummaryResponse.builder()
                .tripId(100L)
                .tripName("Chuyến đi Đà Nẵng")
                .tripStatus(TripStatus.SETTLED)
                .balances(List.of(b1, b2))
                .suggestedTransfers(List.of(mockTransferDTO))
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/trips/{tripId}/settlements - Xem bảng tổng sắp & đề xuất chuyển khoản thành công (HTTP 200)")
    void getSettlementSummary_Success() throws Exception {
        when(settlementService.getSettlementSummary(100L)).thenReturn(mockSummaryResponse);

        mockMvc.perform(get("/api/v1/trips/100/settlements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy thông tin quyết toán thành công"))
                .andExpect(jsonPath("$.data.balances[0].netBalance").value(400000.00))
                .andExpect(jsonPath("$.data.suggestedTransfers[0].amount").value(400000.00));
    }

    @Test
    @DisplayName("PATCH /api/v1/settlements/{id}/complete - Leader đánh dấu hoàn tất thành công (HTTP 200)")
    void completeSettlement_Success() throws Exception {
        SuggestedTransferDTO completedDTO = SuggestedTransferDTO.builder()
                .id(10L)
                .fromUserId(2L)
                .fromUserName("Trần Thị B")
                .toUserId(1L)
                .toUserName("Nguyễn Văn A")
                .amount(new BigDecimal("400000.00"))
                .isSettled(true)
                .build();

        when(settlementService.completeSettlement(10L, 1L)).thenReturn(completedDTO);

        mockMvc.perform(patch("/api/v1/settlements/10/complete")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isSettled").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/settlements/{id}/complete - Member thường bấm hoàn tất -> HTTP 403 Forbidden")
    void completeSettlement_MemberRole_Forbidden() throws Exception {
        when(settlementService.completeSettlement(10L, 2L))
                .thenThrow(new UnauthorizedAccessException("Chỉ có Trưởng nhóm (Leader) mới có quyền đánh dấu hoàn tất chuyển khoản"));

        mockMvc.perform(patch("/api/v1/settlements/10/complete")
                        .header("X-User-Id", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chỉ có Trưởng nhóm (Leader) mới có quyền đánh dấu hoàn tất chuyển khoản"));
    }
}
