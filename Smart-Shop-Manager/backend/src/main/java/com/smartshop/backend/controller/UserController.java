package com.smartshop.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartshop.backend.dto.ResetPasswordRequest;
import com.smartshop.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/{username}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable String username,
            @Valid @RequestBody ResetPasswordRequest request) {

        userService.resetPassword(username, request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully for user: " + username));
    }
}
