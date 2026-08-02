package com.tripmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripmate.dto.request.CreateTripRequest;
import com.tripmate.dto.request.JoinTripRequest;
import com.tripmate.dto.response.TripMemberResponse;
import com.tripmate.dto.response.TripResponse;
import com.tripmate.enums.Role;
import com.tripmate.enums.TripStatus;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.service.TripService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

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

@WebMvcTest(TripController.class)
@AutoConfigureMockMvc(addFilters = false)
class TripControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TripService tripService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private TripResponse mockTripResponse;

    @BeforeEach
    void setUp() {
        TripMemberResponse leaderMember = TripMemberResponse.builder()
                .id(1L)
                .userId(1L)
                .fullName("Nguyễn Văn A")
                .email("anv@example.com")
                .role(Role.LEADER)
                .build();

        mockTripResponse = TripResponse.builder()
                .id(100L)
                .name("Chuyến đi Đà Nẵng")
                .status(TripStatus.PLANNING)
                .joinCode("ABC123")
                .createdAt(LocalDateTime.now())
                .members(List.of(leaderMember))
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/trips - Tạo chuyến đi mới thành công (HTTP 201)")
    void createTrip_Success() throws Exception {
        CreateTripRequest request = CreateTripRequest.builder()
                .name("Chuyến đi Đà Nẵng")
                .build();

        when(tripService.createTrip(any(CreateTripRequest.class), eq(1L)))
                .thenReturn(mockTripResponse);

        mockMvc.perform(post("/api/v1/trips")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Tạo chuyến đi thành công"))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.name").value("Chuyến đi Đà Nẵng"))
                .andExpect(jsonPath("$.data.joinCode").value("ABC123"))
                .andExpect(jsonPath("$.data.status").value("PLANNING"))
                .andExpect(jsonPath("$.data.members[0].role").value("LEADER"));
    }

    @Test
    @DisplayName("POST /api/v1/trips - Trống tên chuyến đi -> Lỗi Validation (HTTP 400)")
    void createTrip_BlankName_BadRequest() throws Exception {
        CreateTripRequest request = CreateTripRequest.builder()
                .name("  ")
                .build();

        mockMvc.perform(post("/api/v1/trips")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Dữ liệu đầu vào không hợp lệ"))
                .andExpect(jsonPath("$.details.name").exists());
    }

    @Test
    @DisplayName("POST /api/v1/trips/join - Tham gia chuyến đi bằng joinCode thành công (HTTP 200)")
    void joinTrip_Success() throws Exception {
        JoinTripRequest request = JoinTripRequest.builder()
                .joinCode("ABC123")
                .build();

        when(tripService.joinTrip(any(JoinTripRequest.class), eq(2L)))
                .thenReturn(mockTripResponse);

        mockMvc.perform(post("/api/v1/trips/join")
                        .header("X-User-Id", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Gia nhập chuyến đi thành công"))
                .andExpect(jsonPath("$.data.joinCode").value("ABC123"));
    }

    @Test
    @DisplayName("POST /api/v1/trips/join - Trống mã joinCode -> Lỗi Validation (HTTP 400)")
    void joinTrip_BlankJoinCode_BadRequest() throws Exception {
        JoinTripRequest request = JoinTripRequest.builder()
                .joinCode("")
                .build();

        mockMvc.perform(post("/api/v1/trips/join")
                        .header("X-User-Id", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.details.joinCode").exists());
    }

    @Test
    @DisplayName("POST /api/v1/trips/join - Mã joinCode không tồn tại -> Lỗi 404 Not Found")
    void joinTrip_InvalidJoinCode_NotFound() throws Exception {
        JoinTripRequest request = JoinTripRequest.builder()
                .joinCode("INVALID")
                .build();

        when(tripService.joinTrip(any(JoinTripRequest.class), eq(2L)))
                .thenThrow(new ResourceNotFoundException("Chuyến đi không tồn tại hoặc mã tham gia không hợp lệ"));

        mockMvc.perform(post("/api/v1/trips/join")
                        .header("X-User-Id", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chuyến đi không tồn tại hoặc mã tham gia không hợp lệ"));
    }

    @Test
    @DisplayName("GET /api/v1/trips/{tripId} - Xem chi tiết chuyến đi thành công (HTTP 200)")
    void getTripDetail_Success() throws Exception {
        when(tripService.getTripDetail(100L)).thenReturn(mockTripResponse);

        mockMvc.perform(get("/api/v1/trips/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy thông tin chuyến đi thành công"))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.name").value("Chuyến đi Đà Nẵng"));
    }

    @Test
    @DisplayName("GET /api/v1/trips/{tripId} - Không tìm thấy chuyến đi -> Lỗi 404 Not Found")
    void getTripDetail_NotFound() throws Exception {
        when(tripService.getTripDetail(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: 999"));

        mockMvc.perform(get("/api/v1/trips/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Không tìm thấy chuyến đi với ID: 999"));
    }
}
