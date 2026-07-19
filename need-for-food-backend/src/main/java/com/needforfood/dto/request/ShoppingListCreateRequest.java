package com.needforfood.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShoppingListCreateRequest {

    @NotBlank
    private String name;
}
