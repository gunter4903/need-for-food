package com.needforfood.controller;

import com.needforfood.dto.response.UserResponse;
import com.needforfood.mapper.UserMapper;
import com.needforfood.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Long userId) {
        return UserMapper.toResponse(userService.getById(userId));
    }
}
