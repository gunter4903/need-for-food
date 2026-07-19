package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ShoppingListItemResponse {

    private Long ingredientId;
    private String name;
    private String unit;
    private Float quantity;
    private boolean checked;
}
