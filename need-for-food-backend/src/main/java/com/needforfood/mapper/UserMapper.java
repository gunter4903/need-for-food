package com.needforfood.mapper;

import com.needforfood.dto.response.PublicProfileResponse;
import com.needforfood.dto.response.UserResponse;
import com.needforfood.model.entity.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getUsername(), user.getCreatedAt(),
                user.getBio(), user.getAvatarUrl(), user.isVerified());
    }

    public static PublicProfileResponse toPublicProfile(User user) {
        return new PublicProfileResponse(user.getId(), user.getUsername(), user.getAvatarUrl(), user.getBio());
    }
}
