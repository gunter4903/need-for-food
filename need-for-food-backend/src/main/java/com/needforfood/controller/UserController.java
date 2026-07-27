package com.needforfood.controller;

import com.needforfood.dto.request.ChangePasswordRequest;
import com.needforfood.dto.request.UpdateProfileRequest;
import com.needforfood.dto.response.UserResponse;
import com.needforfood.mapper.UserMapper;
import com.needforfood.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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

    @PutMapping("/me")
    public UserResponse updateMe(@AuthenticationPrincipal Long userId, @Valid @RequestBody UpdateProfileRequest request) {
        return UserMapper.toResponse(userService.updateProfile(
                userId, request.getUsername(), request.getEmail(), request.getBio(), request.getAvatarUrl()));
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMe(@AuthenticationPrincipal Long userId) {
        userService.deleteAccount(userId);
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal Long userId, @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());
    }
}
