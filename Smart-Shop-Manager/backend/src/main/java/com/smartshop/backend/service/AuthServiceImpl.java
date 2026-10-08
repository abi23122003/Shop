package com.smartshop.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

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
        if (loginAttemptService.isBlocked(username)) {
            throw new BadCredentialsException("Invalid username or password");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            username,
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException | UsernameNotFoundException ex) {
            loginAttemptService.recordFailure(username);
            throw new BadCredentialsException("Invalid username or password");
        }

        loginAttemptService.recordSuccess(username);
        String token = jwtService.generateToken(username);

        return new LoginResponse(token);
    }
}