package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private String username;
    private LocalDateTime createdAt;
    private String bio;
    private String avatarUrl;
    private boolean verified;
}
