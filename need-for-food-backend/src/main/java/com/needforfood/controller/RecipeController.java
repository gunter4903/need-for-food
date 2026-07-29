package com.needforfood.controller;

import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.response.RecipeMatchResponse;
import com.needforfood.dto.response.RecipeResponse;
import com.needforfood.mapper.RecipeMapper;
import com.needforfood.model.document.UserPreference;
import com.needforfood.model.entity.Recipe;
import com.needforfood.service.PreferenceService;
import com.needforfood.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;
    private final PreferenceService preferenceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecipeResponse create(@AuthenticationPrincipal Long userId, @Valid @RequestBody RecipeRequest request) {
        Recipe recipe = recipeService.createRecipe(userId, RecipeMapper.toEntity(request));
        return RecipeMapper.toResponse(recipe, false);
    }

    @GetMapping
    public List<RecipeResponse> getAll(@AuthenticationPrincipal Long userId) {
        Set<Long> favoriteIds = recipeService.getFavoriteRecipeIds(userId);
        return recipeService.getAll(userId).stream()
                .map(recipe -> RecipeMapper.toResponse(recipe, favoriteIds.contains(recipe.getId())))
                .toList();
    }

    @GetMapping("/search")
    public List<RecipeMatchResponse> search(@AuthenticationPrincipal Long userId, @RequestParam List<String> ingredients) {
        UserPreference preference = preferenceService.getByUserId(userId);
        Set<Long> favoriteIds = recipeService.getFavoriteRecipeIds(userId);
        return recipeService.searchByIngredientNames(
                        userId, ingredients, excludedIngredients(preference), preference.getMaxPreparationTime())
                .stream()
                .map(match -> RecipeMapper.toMatchResponse(match, favoriteIds.contains(match.recipe().getId())))
                .toList();
    }

    @GetMapping("/suggestions")
    public List<RecipeResponse> suggestions(@AuthenticationPrincipal Long userId) {
        UserPreference preference = preferenceService.getByUserId(userId);
        Set<Long> favoriteIds = recipeService.getFavoriteRecipeIds(userId);
        return recipeService.getSuggestions(
                        userId,
                        excludedIngredients(preference),
                        preference.getMaxPreparationTime(),
                        preference.getDiet(),
                        preference.getFavoriteRecipeTypes())
                .stream()
                .map(recipe -> RecipeMapper.toResponse(recipe, favoriteIds.contains(recipe.getId())))
                .toList();
    }

    private List<String> excludedIngredients(UserPreference preference) {
        List<String> excluded = new ArrayList<>();
        if (preference.getAllergies() != null) {
            excluded.addAll(preference.getAllergies());
        }
        if (preference.getDislikedIngredients() != null) {
            excluded.addAll(preference.getDislikedIngredients());
        }
        return excluded;
    }

    @GetMapping("/{id}")
    public RecipeResponse getById(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        Recipe recipe = recipeService.getById(id, userId);
        return RecipeMapper.toResponse(recipe, recipeService.isFavorite(userId, id));
    }

    @GetMapping("/mine")
    public List<RecipeResponse> getMine(@AuthenticationPrincipal Long userId) {
        Set<Long> favoriteIds = recipeService.getFavoriteRecipeIds(userId);
        return recipeService.getByUser(userId).stream()
                .map(recipe -> RecipeMapper.toResponse(recipe, favoriteIds.contains(recipe.getId())))
                .toList();
    }

    @GetMapping("/user/{userId}")
    public List<RecipeResponse> getByUser(@PathVariable Long userId, @AuthenticationPrincipal Long requesterId) {
        Set<Long> favoriteIds = recipeService.getFavoriteRecipeIds(requesterId);
        return recipeService.getByUser(userId, requesterId).stream()
                .map(recipe -> RecipeMapper.toResponse(recipe, favoriteIds.contains(recipe.getId())))
                .toList();
    }

    @PutMapping("/{id}")
    public RecipeResponse update(@PathVariable Long id,
                                  @AuthenticationPrincipal Long userId,
                                  @Valid @RequestBody RecipeRequest request) {
        Recipe updated = recipeService.updateRecipe(id, userId, RecipeMapper.toEntity(request));
        return RecipeMapper.toResponse(updated, recipeService.isFavorite(userId, id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        recipeService.deleteRecipe(id, userId);
    }

    @PostMapping(path = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RecipeResponse addImages(@PathVariable Long id,
                                     @AuthenticationPrincipal Long userId,
                                     @RequestParam("files") List<MultipartFile> files) {
        Recipe updated = recipeService.addImages(id, userId, files);
        return RecipeMapper.toResponse(updated, recipeService.isFavorite(userId, id));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeImage(@PathVariable Long id, @PathVariable Long imageId,
                             @AuthenticationPrincipal Long userId) {
        recipeService.removeImage(id, userId, imageId);
    }

    @PostMapping("/{id}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addFavorite(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        recipeService.addFavorite(userId, id);
    }

    @DeleteMapping("/{id}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavorite(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        recipeService.removeFavorite(userId, id);
    }
}
