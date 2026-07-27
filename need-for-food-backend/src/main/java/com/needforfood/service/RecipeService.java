package com.needforfood.service;

import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeIngredient;
import com.needforfood.model.entity.User;
import com.needforfood.repository.sql.RecipeRepository;
import com.needforfood.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientService ingredientService;
    private final UserRepository userRepository;

    @Transactional
    public Recipe createRecipe(Long userId, Recipe recipe) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));

        recipe.setUser(user);
        linkIngredients(recipe, recipe.getIngredients());
        numberSteps(recipe, recipe.getSteps());

        return recipeRepository.save(recipe);
    }

    @Transactional(readOnly = true)
    public Recipe getById(Long id) {
        Recipe recipe = recipeRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recette introuvable: " + id));
        // ingredients est chargé via JOIN FETCH ; steps est initialisé séparément car
        // Hibernate ne permet pas de JOIN FETCH deux collections (bags) à la fois.
        Hibernate.initialize(recipe.getSteps());
        return recipe;
    }

    @Transactional(readOnly = true)
    public List<Recipe> getByUser(Long userId) {
        List<Recipe> recipes = recipeRepository.findDetailedByUserId(userId);
        recipes.forEach(recipe -> Hibernate.initialize(recipe.getSteps()));
        return recipes;
    }

    @Transactional(readOnly = true)
    public List<Recipe> getAll() {
        List<Recipe> recipes = recipeRepository.findAllDetailed();
        recipes.forEach(recipe -> Hibernate.initialize(recipe.getSteps()));
        return recipes;
    }

    @Transactional(readOnly = true)
    public List<RecipeMatch> searchByIngredientNames(Long userId, List<String> ingredientNames,
                                                       List<String> excludedIngredients, Integer maxPreparationTime) {
        Set<String> normalized = ingredientNames.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        return getByUser(userId).stream()
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
        List<Recipe> recipes = getByUser(userId).stream()
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

        // On vide puis on force l'exécution des DELETE (flush) avant de recréer les lignes :
        // dans un même flush, Hibernate exécute les INSERT/UPDATE avant les DELETE, ce qui viole
        // la contrainte d'unicité (recipe_id, step_number) et déclenche le garde-fou "deleted
        // object would be re-saved by cascade" sur les RecipeIngredient (clé composite @MapsId).
        recipe.getIngredients().clear();
        recipe.getSteps().clear();
        recipeRepository.flush();

        linkIngredients(recipe, updates.getIngredients());
        recipe.getIngredients().addAll(updates.getIngredients());

        numberSteps(recipe, updates.getSteps());
        recipe.getSteps().addAll(updates.getSteps());

        return recipe;
    }

    @Transactional
    public void deleteRecipe(Long recipeId, Long requesterId) {
        Recipe recipe = getById(recipeId);
        assertOwner(recipe, requesterId);
        recipeRepository.delete(recipe);
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
