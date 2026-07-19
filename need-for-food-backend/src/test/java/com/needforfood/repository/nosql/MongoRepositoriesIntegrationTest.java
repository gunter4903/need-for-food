package com.needforfood.repository.nosql;

import com.needforfood.model.document.AvailableIngredientsSession;
import com.needforfood.model.document.IngredientQuantity;
import com.needforfood.model.document.RecipeSearchIndex;
import com.needforfood.model.document.ShoppingListHistory;
import com.needforfood.model.document.UserPreference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
class MongoRepositoriesIntegrationTest {

    @Autowired
    private UserPreferenceRepository userPreferenceRepository;

    @Autowired
    private RecipeSearchIndexRepository recipeSearchIndexRepository;

    @Autowired
    private AvailableIngredientsSessionRepository availableIngredientsSessionRepository;

    @Autowired
    private ShoppingListHistoryRepository shoppingListHistoryRepository;

    @AfterEach
    void cleanUp() {
        userPreferenceRepository.deleteAll();
        recipeSearchIndexRepository.deleteAll();
        availableIngredientsSessionRepository.deleteAll();
        shoppingListHistoryRepository.deleteAll();
    }

    @Test
    void savesAndFindsUserPreferenceByUserId() {
        UserPreference preference = userPreferenceRepository.save(UserPreference.builder()
                .userId(1L)
                .diet(List.of("vegetarien"))
                .allergies(List.of("arachide"))
                .dislikedIngredients(List.of("coriandre"))
                .favoriteRecipeTypes(List.of("plat"))
                .maxPreparationTime(30)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        Optional<UserPreference> found = userPreferenceRepository.findByUserId(1L);

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(preference.getId());
        assertThat(found.get().getDiet()).containsExactly("vegetarien");
    }

    @Test
    void savesAndFindsRecipeSearchIndexByRecipeId() {
        recipeSearchIndexRepository.save(RecipeSearchIndex.builder()
                .recipeId(42L)
                .title("Pâtes au pesto")
                .type("plat")
                .diet("vegetarien")
                .preparationTime(15)
                .ingredients(List.of("Basilic", "Pâtes"))
                .popularityScore(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        assertThat(recipeSearchIndexRepository.findByRecipeId(42L)).isPresent();
        assertThat(recipeSearchIndexRepository.findByTypeIgnoreCase("PLAT")).hasSize(1);
    }

    @Test
    void savesAndFindsAvailableIngredientsSessionByUserId() {
        availableIngredientsSessionRepository.save(AvailableIngredientsSession.builder()
                .userId(2L)
                .ingredients(List.of(IngredientQuantity.builder().name("Tomate").quantity(2f).unit("kg").build()))
                .suggestedRecipes(List.of(1L, 2L))
                .createdAt(LocalDateTime.now())
                .build());

        List<AvailableIngredientsSession> sessions = availableIngredientsSessionRepository.findByUserId(2L);

        assertThat(sessions).hasSize(1);
        assertThat(sessions.get(0).getIngredients()).extracting(IngredientQuantity::getName).containsExactly("Tomate");
    }

    @Test
    void savesAndFindsShoppingListHistoryByUserId() {
        shoppingListHistoryRepository.save(ShoppingListHistory.builder()
                .userId(3L)
                .recipes(List.of(5L, 6L))
                .missingIngredients(List.of(IngredientQuantity.builder().name("Sel").quantity(1f).unit("g").build()))
                .generatedAt(LocalDateTime.now())
                .build());

        List<ShoppingListHistory> history = shoppingListHistoryRepository.findByUserId(3L);

        assertThat(history).hasSize(1);
        assertThat(history.get(0).getRecipes()).containsExactly(5L, 6L);
    }
}
