package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserSearchResultResponse {

    private UserSummaryResponse user;

    private String friendshipStatus;
}
