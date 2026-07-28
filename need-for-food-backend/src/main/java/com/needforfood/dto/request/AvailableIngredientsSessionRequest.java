package com.needforfood.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AvailableIngredientsSessionRequest {

    @NotEmpty
    @Valid
    private List<IngredientQuantityRequest> ingredients;
}
