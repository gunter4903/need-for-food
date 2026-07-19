package com.needforfood.controller;

import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RegisterRequest;
import com.needforfood.dto.response.AuthResponse;
import com.needforfood.dto.response.UserResponse;
import com.needforfood.mapper.UserMapper;
import com.needforfood.model.entity.User;
import com.needforfood.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request.getEmail(), request.getUsername(), request.getPassword());
        return UserMapper.toResponse(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String token = authService.login(request.getEmail(), request.getPassword());
        return new AuthResponse(token);
    }
}
