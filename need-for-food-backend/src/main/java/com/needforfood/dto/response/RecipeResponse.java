package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class RecipeResponse {

    private Long id;
    private String title;
    private String description;
    private String type;
    private String diet;
    private Integer preparationTime;
    private LocalDateTime createdAt;
    private Long userId;
    private List<RecipeIngredientResponse> ingredients;
    private List<String> steps;
}
