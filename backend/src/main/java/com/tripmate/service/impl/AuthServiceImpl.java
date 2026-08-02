package com.tripmate.service.impl;

import com.tripmate.dto.request.LoginRequest;
import com.tripmate.dto.request.RegisterRequest;
import com.tripmate.dto.response.AuthResponse;
import com.tripmate.dto.response.UserResponse;
import com.tripmate.entity.User;
import com.tripmate.exception.DuplicateResourceException;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.repository.UserRepository;
import com.tripmate.security.JwtTokenProvider;
import com.tripmate.security.SecurityUtils;
import com.tripmate.security.UserPrincipal;
import com.tripmate.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Bắt đầu xử lý đăng ký tài khoản cho email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Đăng ký thất bại: Email {} đã tồn tại", request.getEmail());
            throw new DuplicateResourceException("Email này đã được sử dụng trong hệ thống");
        }

        User newUser = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("Đã tạo người dùng mới thành công với ID: {}", savedUser.getId());

        String token = jwtTokenProvider.generateTokenFromEmail(savedUser.getEmail(), savedUser.getId());
        UserResponse userResponse = UserResponse.fromEntity(savedUser);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }

    @Override
    public AuthResponse
    login(LoginRequest request) {
        log.info("Bắt đầu xác thực đăng nhập cho email: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        String token = jwtTokenProvider.generateToken(authentication);
        log.info("Đăng nhập thành công cho người dùng ID: {}", userPrincipal.getId());

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng"));

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(user))
                .build();
    }

    @Override
    public UserResponse getCurrentUser() {
        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + currentUserId));

        return UserResponse.fromEntity(user);
    }
}
