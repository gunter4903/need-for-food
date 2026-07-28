package com.needforfood.mapper;

import com.needforfood.dto.response.UserResponse;
import com.needforfood.model.entity.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getUsername(), user.getCreatedAt(),
                user.getBio(), user.getAvatarUrl(), user.isVerified());
    }
}
