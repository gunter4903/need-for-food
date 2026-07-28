package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FriendRequestResponse {

    private Long id;
    private UserSummaryResponse requester;
    private UserSummaryResponse addressee;
    private String status;
    private LocalDateTime createdAt;
}
