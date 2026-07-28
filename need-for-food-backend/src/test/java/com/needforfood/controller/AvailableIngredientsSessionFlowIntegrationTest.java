package com.needforfood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.AvailableIngredientsSessionRequest;
import com.needforfood.dto.request.IngredientQuantityRequest;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RecipeIngredientRequest;
import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.request.RegisterRequest;
import com.needforfood.repository.nosql.AvailableIngredientsSessionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AvailableIngredientsSessionFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AvailableIngredientsSessionRepository sessionRepository;

    @AfterEach
    void cleanUpMongo() {
        sessionRepository.deleteAll();
    }

    private String registerAndLogin(String emailPrefix) throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail(emailPrefix + "@needforfood.dev");
        register.setUsername(emailPrefix);
        register.setPassword("s3cret-pwd");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest();
        login.setEmail(register.getEmail());
        login.setPassword("s3cret-pwd");

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    private long createRecipe(String token, String title, String ingredientName) throws Exception {
        RecipeIngredientRequest ingredient = new RecipeIngredientRequest();
        ingredient.setIngredientName(ingredientName);
        ingredient.setUnit("g");
        ingredient.setQuantity(100f);

        RecipeRequest recipe = new RecipeRequest();
        recipe.setTitle(title);
        recipe.setPreparationTime(10);
        recipe.setIngredients(List.of(ingredient));
        recipe.setSteps(List.of("Étape unique"));

        String response = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recipe)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private IngredientQuantityRequest ingredientQuantity(String name) {
        IngredientQuantityRequest request = new IngredientQuantityRequest();
        request.setName(name);
        request.setQuantity(1f);
        request.setUnit("unité");
        return request;
    }

    @Test
    void savingASessionComputesSuggestedRecipesFromExistingRecipes() throws Exception {
        String token = registerAndLogin("ingredient-session-save");
        long recipeId = createRecipe(token, "Riz sauté", "Riz");

        AvailableIngredientsSessionRequest request = new AvailableIngredientsSessionRequest();
        request.setIngredients(List.of(ingredientQuantity("Riz")));

        mockMvc.perform(post("/api/ingredient-sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ingredients[0].name").value("Riz"))
                .andExpect(jsonPath("$.suggestedRecipeIds[0]").value(recipeId));
    }

    @Test
    void mineListsPastSessionsMostRecentFirst() throws Exception {
        String token = registerAndLogin("ingredient-session-history");

        AvailableIngredientsSessionRequest first = new AvailableIngredientsSessionRequest();
        first.setIngredients(List.of(ingredientQuantity("Farine")));
        mockMvc.perform(post("/api/ingredient-sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        AvailableIngredientsSessionRequest second = new AvailableIngredientsSessionRequest();
        second.setIngredients(List.of(ingredientQuantity("Sucre")));
        mockMvc.perform(post("/api/ingredient-sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/ingredient-sessions/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].ingredients[0].name").value("Sucre"))
                .andExpect(jsonPath("$[1].ingredients[0].name").value("Farine"));
    }

    @Test
    void requestWithoutIngredientsReturns400() throws Exception {
        String token = registerAndLogin("ingredient-session-invalid");

        AvailableIngredientsSessionRequest request = new AvailableIngredientsSessionRequest();
        request.setIngredients(List.of());

        mockMvc.perform(post("/api/ingredient-sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
