package com.smartshop.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

import com.smartshop.backend.dto.LoginRequest;
import com.smartshop.backend.dto.LoginResponse;
import com.smartshop.backend.security.JwtService;
import com.smartshop.backend.security.LoginAttemptService;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Override
    public LoginResponse login(LoginRequest request) {

        String username = request.getUsername().trim();
        String rateLimitKey = buildRateLimitKey(username);

        if (loginAttemptService.isBlocked(rateLimitKey)) {
            throw new BadCredentialsException("Invalid username or password");
        }

        org.springframework.security.core.Authentication authResult;
        try {
            authResult = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            username,
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException | UsernameNotFoundException ex) {
            loginAttemptService.recordFailure(rateLimitKey);
            throw new BadCredentialsException("Invalid username or password");
        }

        loginAttemptService.recordSuccess(rateLimitKey);
        String passwordHash = authResult.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails ud
                ? ud.getPassword()
                : null;
        String token = jwtService.generateToken(username, passwordHash);

        return new LoginResponse(token);
    }

    private String buildRateLimitKey(String username) {
        String clientIp = resolveClientIp();
        return clientIp + ":" + username.toLowerCase();
    }

    private String resolveClientIp() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null && attributes.getRequest() != null) {
                HttpServletRequest request = attributes.getRequest();
                String remoteAddr = request.getRemoteAddr();
                if (remoteAddr != null && !remoteAddr.isBlank()) {
                    return remoteAddr.trim();
                }
            }
        } catch (Exception ignored) {
        }
        return "local";
    }
}
