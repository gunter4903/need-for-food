package com.needforfood.controller;

import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.response.RecipeResponse;
import com.needforfood.mapper.RecipeMapper;
import com.needforfood.model.entity.Recipe;
import com.needforfood.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecipeResponse create(@AuthenticationPrincipal Long userId, @Valid @RequestBody RecipeRequest request) {
        Recipe recipe = recipeService.createRecipe(userId, RecipeMapper.toEntity(request));
        return RecipeMapper.toResponse(recipe);
    }

    @GetMapping("/{id}")
    public RecipeResponse getById(@PathVariable Long id) {
        return RecipeMapper.toResponse(recipeService.getById(id));
    }

    @GetMapping("/mine")
    public List<RecipeResponse> getMine(@AuthenticationPrincipal Long userId) {
        return recipeService.getByUser(userId).stream().map(RecipeMapper::toResponse).toList();
    }

    @PutMapping("/{id}")
    public RecipeResponse update(@PathVariable Long id,
                                  @AuthenticationPrincipal Long userId,
                                  @Valid @RequestBody RecipeRequest request) {
        Recipe updated = recipeService.updateRecipe(id, userId, RecipeMapper.toEntity(request));
        return RecipeMapper.toResponse(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        recipeService.deleteRecipe(id, userId);
    }
}
