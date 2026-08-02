package com.tripmate.service;

import com.tripmate.dto.request.LoginRequest;
import com.tripmate.dto.request.RegisterRequest;
import com.tripmate.dto.response.AuthResponse;
import com.tripmate.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser();
}
