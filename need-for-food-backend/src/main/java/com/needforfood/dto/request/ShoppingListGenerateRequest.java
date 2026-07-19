package com.needforfood.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ShoppingListGenerateRequest {

    @NotBlank
    private String name;

    @NotEmpty
    private List<Long> recipeIds;
}
