package com.needforfood.repository.sql;

import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class JpaRepositoriesIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Test
    void savesAndFindsUserByEmail() {
        User user = userRepository.save(User.builder()
                .email("test.repo@needforfood.dev")
                .passwordHash("hashed")
                .username("test-user")
                .build());

        Optional<User> found = userRepository.findByEmail("test.repo@needforfood.dev");

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(user.getId());
    }

    @Test
    void savesAndFindsRecipesByUserId() {
        User user = userRepository.save(User.builder()
                .email("owner@needforfood.dev")
                .passwordHash("hashed")
                .username("owner")
                .build());

        recipeRepository.save(Recipe.builder()
                .title("Pâtes au pesto")
                .preparationTime(15)
                .user(user)
                .build());

        assertThat(recipeRepository.findByUserId(user.getId())).hasSize(1);
    }

    @Test
    void savesAndFindsIngredientByNameIgnoreCase() {
        ingredientRepository.save(Ingredient.builder()
                .name("Basilic")
                .unit("g")
                .build());

        assertThat(ingredientRepository.findByNameIgnoreCase("basilic")).isPresent();
    }
}
