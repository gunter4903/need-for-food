package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String tokenType;

    public AuthResponse(String token) {
        this(token, "Bearer");
    }
}
