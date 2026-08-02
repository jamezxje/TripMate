package com.tripmate.controller;

import com.tripmate.dto.request.LoginRequest;
import com.tripmate.dto.request.RegisterRequest;
import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.AuthResponse;
import com.tripmate.dto.response.UserResponse;
import com.tripmate.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("API POST /api/v1/auth/register - Đăng ký tài khoản cho email: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        log.info("API POST /api/v1/auth/register - Đăng ký thành công cho email: {}", request.getEmail());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("API POST /api/v1/auth/login - Đăng nhập tài khoản cho email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        log.info("API POST /api/v1/auth/login - Đăng nhập thành công cho email: {}", request.getEmail());
        return ResponseEntity
                .ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        log.info("API GET /api/v1/auth/me - Lấy thông tin người dùng hiện tại");
        UserResponse response = authService.getCurrentUser();
        log.info("API GET /api/v1/auth/me - Lấy thông tin thành công cho email: {}", response.getEmail());
        return ResponseEntity
                .ok(ApiResponse.success("Lấy thông tin người dùng thành công", response));
    }
}
