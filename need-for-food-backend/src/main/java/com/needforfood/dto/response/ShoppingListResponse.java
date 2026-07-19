package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ShoppingListResponse {

    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private Long userId;
    private List<ShoppingListItemResponse> items;
}
