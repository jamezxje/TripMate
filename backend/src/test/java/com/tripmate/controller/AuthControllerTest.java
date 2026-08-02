package com.tripmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripmate.dto.request.LoginRequest;
import com.tripmate.dto.request.RegisterRequest;
import com.tripmate.dto.response.AuthResponse;
import com.tripmate.dto.response.UserResponse;
import com.tripmate.exception.DuplicateResourceException;
import com.tripmate.security.CustomUserDetailsService;
import com.tripmate.security.JwtTokenProvider;
import com.tripmate.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private AuthResponse mockAuthResponse;
    private UserResponse mockUserResponse;

    @BeforeEach
    void setUp() {
        mockUserResponse = UserResponse.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .createdAt(LocalDateTime.now())
                .build();

        mockAuthResponse = AuthResponse.builder()
                .accessToken("mocked.jwt.token")
                .tokenType("Bearer")
                .user(mockUserResponse)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Đăng ký thành công (HTTP 201)")
    void register_Success() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Test User")
                .email("test@example.com")
                .password("password123")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockAuthResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đăng ký tài khoản thành công"))
                .andExpect(jsonPath("$.data.accessToken").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.data.user.email").value("test@example.com"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Mật khẩu < 6 ký tự -> Lỗi Validation (HTTP 400)")
    void register_ShortPassword_BadRequest() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Test User")
                .email("test@example.com")
                .password("12345") // Less than 6 chars
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.details.password").exists());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Email trùng -> HTTP 400 Bad Request")
    void register_DuplicateEmail_BadRequest() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Test User")
                .email("existing@example.com")
                .password("password123")
                .build();

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("Email này đã được sử dụng trong hệ thống"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email này đã được sử dụng trong hệ thống"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Đăng nhập thành công (HTTP 200)")
    void login_Success() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(mockAuthResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đăng nhập thành công"))
                .andExpect(jsonPath("$.data.accessToken").value("mocked.jwt.token"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Sai mật khẩu -> HTTP 400 Bad Request")
    void login_InvalidCredentials_BadRequest() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("wrongpassword")
                .build();

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không chính xác"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - Lấy thông tin user hiện tại thành công (HTTP 200)")
    void getCurrentUser_Success() throws Exception {
        when(authService.getCurrentUser()).thenReturn(mockUserResponse);

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy thông tin người dùng thành công"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }
}
