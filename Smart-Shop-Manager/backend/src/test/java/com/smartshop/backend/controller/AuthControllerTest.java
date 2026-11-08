package com.smartshop.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import com.smartshop.backend.dto.LoginRequest;
import com.smartshop.backend.dto.LoginResponse;
import com.smartshop.backend.dto.RegisterRequest;
import com.smartshop.backend.dto.RegisterResponse;
import com.smartshop.backend.service.AuthService;

class AuthControllerTest {

    private AuthController authController;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authController = new AuthController();
        authService = mock(AuthService.class);
        ReflectionTestUtils.setField(authController, "authService", authService);
    }

    @Test
    void registerReturnsCreatedWithPendingApprovalMessage() {
        RegisterRequest request = new RegisterRequest("new_retailer", "StrongPass123!", "StrongPass123!");
        RegisterResponse expectedResponse = new RegisterResponse(
                "Registration successful! Your account has been created and is pending administrator approval before you can sign in.",
                "new_retailer",
                false
        );
        when(authService.register(any(RegisterRequest.class))).thenReturn(expectedResponse);

        ResponseEntity<RegisterResponse> response = authController.register(request);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("new_retailer", response.getBody().getUsername());
        assertFalse(response.getBody().isApproved());
        verify(authService).register(request);
    }

    @Test
    void loginCallsAuthService() {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("Pavi@2003");
        when(authService.login(request)).thenReturn(new LoginResponse("mock-jwt-token"));

        LoginResponse response = authController.login(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        verify(authService).login(request);
    }
}
