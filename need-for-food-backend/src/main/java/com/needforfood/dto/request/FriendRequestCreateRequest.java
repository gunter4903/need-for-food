package com.needforfood.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FriendRequestCreateRequest {

    @NotNull
    private Long userId;
}
