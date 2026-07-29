package com.needforfood.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RecipeRequest {

    @NotBlank
    private String title;

    private String description;

    private String type;

    private String diet;

    private String difficulty;

    @PositiveOrZero
    private Integer preparationTime;

    @Valid
    @NotEmpty
    private List<RecipeIngredientRequest> ingredients;

    @NotEmpty
    private List<@NotBlank String> steps;
}
