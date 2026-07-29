package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RecipeImageResponse {

    private Long id;
    private String url;
    private Integer position;
}
