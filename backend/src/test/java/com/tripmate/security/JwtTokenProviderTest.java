package com.tripmate.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971";
    private final long expirationMs = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(secret, expirationMs);
    }

    @Test
    @DisplayName("Tạo và xác thực JWT Token hợp lệ thành công")
    void generateAndValidateToken_Success() {
        String email = "testuser@example.com";
        Long userId = 123L;

        String token = jwtTokenProvider.generateTokenFromEmail(email, userId);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals(email, jwtTokenProvider.getEmailFromToken(token));
        assertEquals(userId, jwtTokenProvider.getUserIdFromToken(token));
    }

    @Test
    @DisplayName("Xác thực JWT Token không hợp lệ -> Trả về false")
    void validateToken_InvalidToken_ReturnsFalse() {
        String invalidToken = "invalid.jwt.token";

        assertFalse(jwtTokenProvider.validateToken(invalidToken));
    }

    @Test
    @DisplayName("Xác thực JWT Token hết hạn -> Trả về false")
    void validateToken_ExpiredToken_ReturnsFalse() {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(secret, -1000); // Already expired
        String token = shortLivedProvider.generateTokenFromEmail("expired@example.com", 999L);

        assertFalse(shortLivedProvider.validateToken(token));
    }
}
