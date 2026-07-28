package com.needforfood.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IngredientQuantityRequest {

    @NotBlank
    private String name;

    private Float quantity;
    private String unit;
}
