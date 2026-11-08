package com.smartshop.backend.service;

import com.smartshop.backend.dto.LoginRequest;
import com.smartshop.backend.dto.LoginResponse;
import com.smartshop.backend.dto.RegisterRequest;
import com.smartshop.backend.dto.RegisterResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    RegisterResponse register(RegisterRequest request);

}
