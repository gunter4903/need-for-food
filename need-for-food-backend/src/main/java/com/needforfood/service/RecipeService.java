package com.needforfood.service;

import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeIngredient;
import com.needforfood.model.entity.User;
import com.needforfood.repository.sql.IngredientRepository;
import com.needforfood.repository.sql.RecipeRepository;
import com.needforfood.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
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
        return recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recette introuvable: " + id));
    }

    @Transactional(readOnly = true)
    public List<Recipe> getByUser(Long userId) {
        return recipeRepository.findByUserId(userId);
    }

    @Transactional
    public Recipe updateRecipe(Long recipeId, Long requesterId, Recipe updates) {
        Recipe recipe = getById(recipeId);
        assertOwner(recipe, requesterId);

        recipe.setTitle(updates.getTitle());
        recipe.setDescription(updates.getDescription());
        recipe.setType(updates.getType());
        recipe.setDiet(updates.getDiet());
        recipe.setPreparationTime(updates.getPreparationTime());

        recipe.getIngredients().clear();
        linkIngredients(recipe, updates.getIngredients());
        recipe.getIngredients().addAll(updates.getIngredients());

        recipe.getSteps().clear();
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
        return ingredientRepository.findByNameIgnoreCase(candidate.getName())
                .orElseGet(() -> ingredientRepository.save(candidate));
    }

    private void assertOwner(Recipe recipe, Long requesterId) {
        if (!recipe.getUser().getId().equals(requesterId)) {
            throw new AccessDeniedException("Vous ne pouvez modifier que vos propres recettes");
        }
    }
}
