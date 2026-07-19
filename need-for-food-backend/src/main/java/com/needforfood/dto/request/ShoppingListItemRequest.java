package com.needforfood.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShoppingListItemRequest {

    @NotBlank
    private String ingredientName;

    @NotBlank
    private String unit;

    @Positive
    private Float quantity;
}
