package com.needforfood.controller;

import com.needforfood.dto.UserDataPayload;
import com.needforfood.dto.request.ChangePasswordRequest;
import com.needforfood.dto.request.UpdateProfileRequest;
import com.needforfood.dto.response.ImportSummaryResponse;
import com.needforfood.dto.response.PublicProfileResponse;
import com.needforfood.dto.response.UserResponse;
import com.needforfood.dto.response.UserSearchResultResponse;
import com.needforfood.mapper.FriendshipMapper;
import com.needforfood.mapper.UserMapper;
import com.needforfood.service.FriendshipService;
import com.needforfood.service.UserDataTransferService;
import com.needforfood.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FriendshipService friendshipService;
    private final UserDataTransferService userDataTransferService;

    @GetMapping("/search")
    public List<UserSearchResultResponse> search(@AuthenticationPrincipal Long userId, @RequestParam String q) {
        return userService.search(userId, q).stream()
                .map(user -> FriendshipMapper.toSearchResult(user, friendshipService.getStatusBetween(userId, user.getId())))
                .toList();
    }

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

    @GetMapping("/{id}")
    public PublicProfileResponse getPublicProfile(@PathVariable Long id) {
        return UserMapper.toPublicProfile(userService.getById(id));
    }

    @GetMapping("/me/export")
    public UserDataPayload exportMyData(@AuthenticationPrincipal Long userId) {
        return userDataTransferService.exportData(userId);
    }

    @PostMapping("/me/import")
    public ImportSummaryResponse importMyData(@AuthenticationPrincipal Long userId,
                                               @RequestBody UserDataPayload payload) {
        return userDataTransferService.importData(userId, payload);
    }
}
