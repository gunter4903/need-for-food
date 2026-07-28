package com.needforfood.controller;

import com.needforfood.dto.request.FriendRequestCreateRequest;
import com.needforfood.dto.response.FriendRequestResponse;
import com.needforfood.dto.response.UserSummaryResponse;
import com.needforfood.mapper.FriendshipMapper;
import com.needforfood.service.FriendshipService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @GetMapping
    public List<UserSummaryResponse> getFriends(@AuthenticationPrincipal Long userId) {
        return friendshipService.getFriends(userId).stream().map(FriendshipMapper::toSummary).toList();
    }

    @DeleteMapping("/{friendUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfriend(@PathVariable Long friendUserId, @AuthenticationPrincipal Long userId) {
        friendshipService.unfriend(userId, friendUserId);
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public FriendRequestResponse sendRequest(@AuthenticationPrincipal Long userId,
                                              @Valid @RequestBody FriendRequestCreateRequest request) {
        return FriendshipMapper.toResponse(friendshipService.sendRequest(userId, request.getUserId()));
    }

    @GetMapping("/requests/received")
    public List<FriendRequestResponse> getReceivedRequests(@AuthenticationPrincipal Long userId) {
        return friendshipService.getReceivedRequests(userId).stream().map(FriendshipMapper::toResponse).toList();
    }

    @GetMapping("/requests/sent")
    public List<FriendRequestResponse> getSentRequests(@AuthenticationPrincipal Long userId) {
        return friendshipService.getSentRequests(userId).stream().map(FriendshipMapper::toResponse).toList();
    }

    @PutMapping("/requests/{id}/accept")
    public FriendRequestResponse accept(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        return FriendshipMapper.toResponse(friendshipService.accept(id, userId));
    }

    @DeleteMapping("/requests/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelOrReject(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        friendshipService.cancelOrReject(id, userId);
    }
}
