package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.smartshop.backend.dto.LoginRequest;
import com.smartshop.backend.security.JwtService;
import com.smartshop.backend.security.LoginAttemptService;

class AuthServiceImplTest {

    private AuthServiceImpl authService;
    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl();
        loginAttemptService = new LoginAttemptService();

        AuthenticationManager authenticationManager = authentication -> {
            throw new BadCredentialsException("database detail");
        };

        ReflectionTestUtils.setField(authService, "authenticationManager", authenticationManager);
        ReflectionTestUtils.setField(authService, "jwtService", new JwtService());
        ReflectionTestUtils.setField(authService, "loginAttemptService", loginAttemptService);
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void invalidLoginReturnsGenericAuthenticationFailure() {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("wrong");

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void rateLimitUsesRemoteAddrAndIgnoresForwardedForHeader() {
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("198.51.100.50");
        httpRequest.addHeader("X-Forwarded-For", "203.0.113.199");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(httpRequest));

        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("wrong");

        // Record 5 failures
        for (int i = 0; i < 5; i++) {
            assertThrows(BadCredentialsException.class, () -> authService.login(request));
        }

        // Key based on getRemoteAddr() should be blocked
        assertTrue(loginAttemptService.isBlocked("198.51.100.50:admin"));
        // Key based on spoofed X-Forwarded-For must NOT be blocked
        assertFalse(loginAttemptService.isBlocked("203.0.113.199:admin"));
    }
}
