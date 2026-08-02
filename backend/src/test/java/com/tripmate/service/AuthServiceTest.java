package com.tripmate.service;

import com.tripmate.dto.request.LoginRequest;
import com.tripmate.dto.request.RegisterRequest;
import com.tripmate.dto.response.AuthResponse;
import com.tripmate.dto.response.UserResponse;
import com.tripmate.entity.User;
import com.tripmate.exception.DuplicateResourceException;
import com.tripmate.repository.UserRepository;
import com.tripmate.security.JwtTokenProvider;
import com.tripmate.security.UserPrincipal;
import com.tripmate.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .passwordHash("encoded_password")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Đăng ký tài khoản thành công - Trả về AuthResponse chứa Token và User profile")
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Test User")
                .email("test@example.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(jwtTokenProvider.generateTokenFromEmail("test@example.com", 1L)).thenReturn("mocked_jwt_token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mocked_jwt_token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("test@example.com", response.getUser().getEmail());

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi email đã tồn tại -> Ném DuplicateResourceException")
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Test User")
                .email("test@example.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng nhập thành công - Trả về AuthResponse")
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        UserPrincipal principal = UserPrincipal.create(mockUser);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("mocked_jwt_token");
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mocked_jwt_token", response.getAccessToken());
        assertEquals("test@example.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi sai email/password -> Ném BadCredentialsException")
    void login_InvalidCredentials_ThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("wrongpassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Lấy thông tin me của người dùng đang đăng nhập thành công")
    void getCurrentUser_Success() {
        UserPrincipal principal = UserPrincipal.create(mockUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        UserResponse response = authService.getCurrentUser();

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("test@example.com", response.getEmail());

        SecurityContextHolder.clearContext();
    }
}
