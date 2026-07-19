package com.needforfood.service;

import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeIngredient;
import com.needforfood.model.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class RecipeServiceIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private RecipeService recipeService;

    @Test
    void createsRecipeWithIngredientsAndOrderedSteps() {
        User owner = userService.register("chef@needforfood.dev", "chef", "pwd");

        Recipe recipe = Recipe.builder()
                .title("Pâtes au pesto")
                .description("Rapide et savoureux")
                .type("plat")
                .diet("vegetarien")
                .preparationTime(15)
                .ingredients(List.of(
                        RecipeIngredient.builder()
                                .ingredient(Ingredient.builder().name("Basilic").unit("g").build())
                                .quantity(20f)
                                .build()
                ))
                .steps(List.of(
                        PreparationStep.builder().description("Cuire les pâtes").build(),
                        PreparationStep.builder().description("Mixer le pesto").build()
                ))
                .build();

        Recipe saved = recipeService.createRecipe(owner.getId(), recipe);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getIngredients()).hasSize(1);
        assertThat(saved.getIngredients().get(0).getIngredient().getId()).isNotNull();
        assertThat(saved.getSteps()).extracting(PreparationStep::getStepNumber).containsExactly(1, 2);
        assertThat(recipeService.getByUser(owner.getId())).hasSize(1);
    }

    @Test
    void reusesExistingIngredientByName() {
        User owner = userService.register("chef2@needforfood.dev", "chef2", "pwd");

        Recipe first = buildSingleIngredientRecipe("Recette 1", "Tomate", "kg");
        Recipe second = buildSingleIngredientRecipe("Recette 2", "tomate", "kg");

        Recipe savedFirst = recipeService.createRecipe(owner.getId(), first);
        Recipe savedSecond = recipeService.createRecipe(owner.getId(), second);

        assertThat(savedFirst.getIngredients().get(0).getIngredient().getId())
                .isEqualTo(savedSecond.getIngredients().get(0).getIngredient().getId());
    }

    @Test
    void deniesUpdateByNonOwner() {
        User owner = userService.register("owner@needforfood.dev", "owner", "pwd");
        User stranger = userService.register("stranger@needforfood.dev", "stranger", "pwd");

        Recipe recipe = recipeService.createRecipe(owner.getId(), buildSingleIngredientRecipe("Recette", "Sel", "g"));

        assertThatThrownBy(() -> recipeService.deleteRecipe(recipe.getId(), stranger.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    private Recipe buildSingleIngredientRecipe(String title, String ingredientName, String unit) {
        return Recipe.builder()
                .title(title)
                .preparationTime(10)
                .ingredients(List.of(
                        RecipeIngredient.builder()
                                .ingredient(Ingredient.builder().name(ingredientName).unit(unit).build())
                                .quantity(1f)
                                .build()
                ))
                .steps(List.of())
                .build();
    }
}
