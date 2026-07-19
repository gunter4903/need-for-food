package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class IngredientResponse {

    private Long id;
    private String name;
    private String unit;
}
