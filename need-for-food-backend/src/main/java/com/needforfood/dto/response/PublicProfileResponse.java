package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PublicProfileResponse {

    private Long id;
    private String username;
    private String avatarUrl;
    private String bio;
}
