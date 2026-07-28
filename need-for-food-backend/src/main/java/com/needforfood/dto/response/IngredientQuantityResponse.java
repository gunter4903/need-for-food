package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class IngredientQuantityResponse {

    private String name;
    private Float quantity;
    private String unit;
}
