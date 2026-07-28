package com.needforfood.mapper;

import com.needforfood.dto.response.FriendRequestResponse;
import com.needforfood.dto.response.UserSearchResultResponse;
import com.needforfood.dto.response.UserSummaryResponse;
import com.needforfood.model.entity.Friendship;
import com.needforfood.model.entity.User;

public final class FriendshipMapper {

    private FriendshipMapper() {
    }

    public static UserSummaryResponse toSummary(User user) {
        return new UserSummaryResponse(user.getId(), user.getUsername(), user.getAvatarUrl());
    }

    public static UserSearchResultResponse toSearchResult(User user, String friendshipStatus) {
        return new UserSearchResultResponse(toSummary(user), friendshipStatus);
    }

    public static FriendRequestResponse toResponse(Friendship friendship) {
        return new FriendRequestResponse(
                friendship.getId(),
                toSummary(friendship.getRequester()),
                toSummary(friendship.getAddressee()),
                friendship.getStatus().name(),
                friendship.getCreatedAt());
    }
}
