package com.needforfood.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @Email
    private String email;

    @Size(min = 2, max = 100)
    private String username;

    @Size(max = 500, message = "La bio ne peut pas dépasser 500 caractères")
    private String bio;

    private String avatarUrl;
}
