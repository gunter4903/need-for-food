package com.needforfood.service;

import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.model.document.RecipeSearchIndex;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeIngredient;
import com.needforfood.model.entity.User;
import com.needforfood.repository.nosql.RecipeSearchIndexRepository;
import com.needforfood.repository.sql.RecipeRepository;
import com.needforfood.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientService ingredientService;
    private final UserRepository userRepository;
    private final RecipeSearchIndexRepository recipeSearchIndexRepository;
    private final FriendshipService friendshipService;

    @Transactional
    public Recipe createRecipe(Long userId, Recipe recipe) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));

        recipe.setUser(user);
        linkIngredients(recipe, recipe.getIngredients());
        numberSteps(recipe, recipe.getSteps());

        Recipe saved = recipeRepository.save(recipe);
        syncSearchIndex(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public Recipe getById(Long id) {
        Recipe recipe = recipeRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recette introuvable: " + id));
        Hibernate.initialize(recipe.getSteps());
        return recipe;
    }

    @Transactional(readOnly = true)
    public Recipe getById(Long id, Long requesterId) {
        Recipe recipe = getById(id);
        if (!recipe.getUser().getId().equals(requesterId)
                && !friendshipService.areFriends(requesterId, recipe.getUser().getId())) {
            throw new AccessDeniedException("Vous ne pouvez consulter que vos recettes ou celles de vos amis");
        }
        return recipe;
    }

    @Transactional(readOnly = true)
    public List<Recipe> getByUser(Long userId) {
        List<Recipe> recipes = recipeRepository.findDetailedByUserId(userId);
        recipes.forEach(recipe -> Hibernate.initialize(recipe.getSteps()));
        return recipes;
    }

    @Transactional(readOnly = true)
    public List<Recipe> getByUser(Long userId, Long requesterId) {
        if (!userId.equals(requesterId) && !friendshipService.areFriends(requesterId, userId)) {
            throw new AccessDeniedException("Vous ne pouvez consulter que vos recettes ou celles de vos amis");
        }
        return getByUser(userId);
    }

    @Transactional(readOnly = true)
    public List<Recipe> getAll(Long userId) {
        Set<Long> visibleUserIds = friendshipService.getFriendIds(userId);
        visibleUserIds.add(userId);

        List<Recipe> recipes = recipeRepository.findAllDetailed().stream()
                .filter(recipe -> visibleUserIds.contains(recipe.getUser().getId()))
                .toList();
        recipes.forEach(recipe -> Hibernate.initialize(recipe.getSteps()));
        return deduplicate(recipes, userId);
    }

    private List<Recipe> deduplicate(List<Recipe> recipes, Long userId) {
        Map<String, Recipe> bestByFingerprint = new LinkedHashMap<>();

        for (Recipe recipe : recipes) {
            String fingerprint = fingerprint(recipe);
            Recipe current = bestByFingerprint.get(fingerprint);

            if (current == null
                    || (!current.getUser().getId().equals(userId) && recipe.getUser().getId().equals(userId))
                    || (!current.getUser().getId().equals(userId) && recipe.getId() < current.getId())) {
                bestByFingerprint.put(fingerprint, recipe);
            }
        }

        return new ArrayList<>(bestByFingerprint.values());
    }

    private String fingerprint(Recipe recipe) {
        String ingredientsPart = recipe.getIngredients().stream()
                .map(ri -> normalize(ri.getIngredient().getName()) + ":" + ri.getQuantity()
                        + ":" + normalize(ri.getIngredient().getUnit()))
                .sorted()
                .collect(Collectors.joining("|"));

        String stepsPart = recipe.getSteps().stream()
                .sorted(Comparator.comparing(PreparationStep::getStepNumber))
                .map(step -> normalize(step.getDescription()))
                .collect(Collectors.joining("|"));

        return String.join("::",
                normalize(recipe.getTitle()),
                normalize(recipe.getDescription()),
                normalize(recipe.getType()),
                normalize(recipe.getDiet()),
                normalize(recipe.getDifficulty()),
                String.valueOf(recipe.getPreparationTime()),
                ingredientsPart,
                stepsPart);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    @Transactional(readOnly = true)
    public List<RecipeMatch> searchByIngredientNames(Long userId, List<String> ingredientNames,
                                                       List<String> excludedIngredients, Integer maxPreparationTime) {
        Set<String> normalized = ingredientNames.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        return getAll(userId).stream()
                .filter(recipe -> respectsConstraints(recipe, excludedIngredients, maxPreparationTime))
                .map(recipe -> {
                    int total = recipe.getIngredients().size();
                    int matched = (int) recipe.getIngredients().stream()
                            .filter(ri -> normalized.contains(ri.getIngredient().getName().toLowerCase()))
                            .count();
                    return new RecipeMatch(recipe, matched, total);
                })
                .filter(match -> match.matchedCount() > 0)
                .sorted(Comparator.comparingInt(RecipeMatch::matchedCount).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Recipe> getSuggestions(Long userId, List<String> excludedIngredients, Integer maxPreparationTime,
                                        List<String> preferredDiets, List<String> preferredTypes) {
        List<Recipe> recipes = getAll(userId).stream()
                .filter(recipe -> respectsConstraints(recipe, excludedIngredients, maxPreparationTime))
                .collect(Collectors.toList());

        recipes.sort(Comparator.comparingInt(
                recipe -> matchesPreference(recipe, preferredDiets, preferredTypes) ? 0 : 1));

        return recipes;
    }

    private boolean respectsConstraints(Recipe recipe, List<String> excludedIngredients, Integer maxPreparationTime) {
        if (maxPreparationTime != null && recipe.getPreparationTime() != null
                && recipe.getPreparationTime() > maxPreparationTime) {
            return false;
        }
        if (excludedIngredients == null || excludedIngredients.isEmpty()) {
            return true;
        }
        Set<String> excluded = excludedIngredients.stream().map(String::toLowerCase).collect(Collectors.toSet());
        return recipe.getIngredients().stream()
                .noneMatch(ri -> excluded.contains(ri.getIngredient().getName().toLowerCase()));
    }

    private boolean matchesPreference(Recipe recipe, List<String> preferredDiets, List<String> preferredTypes) {
        boolean dietMatch = preferredDiets != null && recipe.getDiet() != null
                && preferredDiets.stream().anyMatch(diet -> diet.equalsIgnoreCase(recipe.getDiet()));
        boolean typeMatch = preferredTypes != null && recipe.getType() != null
                && preferredTypes.stream().anyMatch(type -> type.equalsIgnoreCase(recipe.getType()));
        return dietMatch || typeMatch;
    }

    @Transactional
    public Recipe updateRecipe(Long recipeId, Long requesterId, Recipe updates) {
        Recipe recipe = getById(recipeId);
        assertOwner(recipe, requesterId);

        recipe.setTitle(updates.getTitle());
        recipe.setDescription(updates.getDescription());
        recipe.setType(updates.getType());
        recipe.setDiet(updates.getDiet());
        recipe.setDifficulty(updates.getDifficulty());
        recipe.setImageUrl(updates.getImageUrl());
        recipe.setPreparationTime(updates.getPreparationTime());

        recipe.getIngredients().clear();
        recipe.getSteps().clear();
        recipeRepository.flush();

        linkIngredients(recipe, updates.getIngredients());
        recipe.getIngredients().addAll(updates.getIngredients());

        numberSteps(recipe, updates.getSteps());
        recipe.getSteps().addAll(updates.getSteps());

        syncSearchIndex(recipe);
        return recipe;
    }

    @Transactional
    public void deleteRecipe(Long recipeId, Long requesterId) {
        Recipe recipe = getById(recipeId);
        assertOwner(recipe, requesterId);
        recipeRepository.delete(recipe);
        recipeSearchIndexRepository.deleteByRecipeId(recipeId);
    }

    private void syncSearchIndex(Recipe recipe) {
        List<String> ingredientNames = recipe.getIngredients().stream()
                .map(ri -> ri.getIngredient().getName())
                .toList();

        RecipeSearchIndex index = recipeSearchIndexRepository.findByRecipeId(recipe.getId())
                .orElseGet(() -> RecipeSearchIndex.builder()
                        .recipeId(recipe.getId())
                        .popularityScore(0)
                        .createdAt(LocalDateTime.now())
                        .build());

        index.setTitle(recipe.getTitle());
        index.setType(recipe.getType());
        index.setDiet(recipe.getDiet());
        index.setPreparationTime(recipe.getPreparationTime());
        index.setIngredients(ingredientNames);
        index.setUpdatedAt(LocalDateTime.now());

        recipeSearchIndexRepository.save(index);
    }

    private void linkIngredients(Recipe recipe, List<RecipeIngredient> ingredients) {
        for (RecipeIngredient recipeIngredient : ingredients) {
            Ingredient resolved = resolveIngredient(recipeIngredient.getIngredient());
            recipeIngredient.setIngredient(resolved);
            recipeIngredient.setRecipe(recipe);
        }
    }

    private void numberSteps(Recipe recipe, List<PreparationStep> steps) {
        for (int i = 0; i < steps.size(); i++) {
            steps.get(i).setRecipe(recipe);
            steps.get(i).setStepNumber(i + 1);
        }
    }

    private Ingredient resolveIngredient(Ingredient candidate) {
        return ingredientService.findOrCreate(candidate.getName(), candidate.getUnit());
    }

    private void assertOwner(Recipe recipe, Long requesterId) {
        if (!recipe.getUser().getId().equals(requesterId)) {
            throw new AccessDeniedException("Vous ne pouvez modifier que vos propres recettes");
        }
    }
}
