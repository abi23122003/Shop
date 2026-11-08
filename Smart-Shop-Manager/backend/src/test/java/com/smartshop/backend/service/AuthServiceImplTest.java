package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.smartshop.backend.dto.LoginRequest;
import com.smartshop.backend.dto.RegisterRequest;
import com.smartshop.backend.dto.RegisterResponse;
import com.smartshop.backend.entity.User;
import com.smartshop.backend.repository.UserRepository;
import com.smartshop.backend.security.JwtService;
import com.smartshop.backend.security.LoginAttemptService;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @InjectMocks
    private AuthServiceImpl authService;

    @Spy
    private LoginAttemptService loginAttemptService = new LoginAttemptService();

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void invalidLoginReturnsGenericAuthenticationFailure() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("wrong");

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void rateLimitUsesRemoteAddrAndIgnoresForwardedForHeader() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

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

        assertTrue(loginAttemptService.isBlocked("198.51.100.50:admin"));
        assertFalse(loginAttemptService.isBlocked("203.0.113.199:admin"));
    }

    @Test
    void registerSuccessfullyCreatesPendingUserWithBcryptPassword() {
        RegisterRequest request = new RegisterRequest("john_doe", "StrongPass123!", "StrongPass123!");
        when(userRepository.existsByUsername("john_doe")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass123!")).thenReturn("$2a$10$encodedPasswordHashMock");

        RegisterResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("john_doe", response.getUsername());
        assertFalse(response.isApproved());
        assertTrue(response.getMessage().toLowerCase().contains("approval"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User saved = captor.getValue();
        assertEquals("john_doe", saved.getUsername());
        assertEquals("ROLE_USER", saved.getRole());
        assertFalse(saved.isApproved());
        assertEquals("$2a$10$encodedPasswordHashMock", saved.getPassword());
    }

    @Test
    void registerFailsWhenUsernameAlreadyExists() {
        RegisterRequest request = new RegisterRequest("existing_user", "StrongPass123!", "StrongPass123!");
        when(userRepository.existsByUsername("existing_user")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("already taken"));
    }

    @Test
    void registerFailsWhenPasswordsDoNotMatch() {
        RegisterRequest request = new RegisterRequest("new_user", "StrongPass123!", "MismatchPass123!");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().toLowerCase().contains("not match"));
    }

    @Test
    void registerFailsWhenPasswordTooShort() {
        RegisterRequest request = new RegisterRequest("new_user", "short", "short");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().toLowerCase().contains("at least 8"));
    }

    @Test
    void unapprovedUserThrowsDisabledException() {
        when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("Account is disabled"));

        LoginRequest request = new LoginRequest();
        request.setUsername("pending_user");
        request.setPassword("StrongPass123!");

        assertThrows(DisabledException.class, () -> authService.login(request));
    }
}
