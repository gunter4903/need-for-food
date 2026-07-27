package com.needforfood.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RecipeIngredientRequest;
import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.request.RegisterRequest;
import com.needforfood.dto.request.UserPreferenceRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class RecipeFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    private RecipeRequest samplePestoRecipe() {
        RecipeIngredientRequest basil = new RecipeIngredientRequest();
        basil.setIngredientName("Basilic");
        basil.setUnit("g");
        basil.setQuantity(20f);

        RecipeRequest recipe = new RecipeRequest();
        recipe.setTitle("Pâtes au pesto");
        recipe.setDescription("Rapide et savoureux");
        recipe.setType("plat");
        recipe.setDiet("vegetarien");
        recipe.setPreparationTime(15);
        recipe.setIngredients(List.of(basil));
        recipe.setSteps(List.of("Cuire les pâtes", "Mixer le pesto"));
        return recipe;
    }

    private long createRecipe(String token, RecipeRequest recipe) throws Exception {
        String response = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recipe)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private void setPreferences(String token, UserPreferenceRequest request) throws Exception {
        mockMvc.perform(put("/api/preferences/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private RecipeIngredientRequest ingredient(String name, String unit, float quantity) {
        RecipeIngredientRequest request = new RecipeIngredientRequest();
        request.setIngredientName(name);
        request.setUnit(unit);
        request.setQuantity(quantity);
        return request;
    }

    private int indexOfRecipeId(JsonNode array, long recipeId) {
        for (int i = 0; i < array.size(); i++) {
            if (array.get(i).get("id").asLong() == recipeId) {
                return i;
            }
        }
        return -1;
    }

    @Test
    void createGetUpdateAndDeleteRecipe() throws Exception {
        String token = registerAndLogin("recipe-owner");

        String createResponse = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Pâtes au pesto"))
                .andExpect(jsonPath("$.ingredients[0].name").value("Basilic"))
                .andExpect(jsonPath("$.steps[0]").value("Cuire les pâtes"))
                .andExpect(jsonPath("$.steps[1]").value("Mixer le pesto"))
                .andReturn().getResponse().getContentAsString();

        long recipeId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Pâtes au pesto"));

        mockMvc.perform(get("/api/recipes/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + recipeId + ")]").isNotEmpty());

        RecipeRequest updateBody = samplePestoRecipe();
        updateBody.setTitle("Pâtes au pesto (v2)");

        mockMvc.perform(put("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Pâtes au pesto (v2)"));

        mockMvc.perform(delete("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void nonOwnerCannotUpdateOrDeleteRecipe() throws Exception {
        String ownerToken = registerAndLogin("owner-recipe");
        String strangerToken = registerAndLogin("stranger-recipe");

        String createResponse = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long recipeId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(delete("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void createRecipeWithoutTitleReturns400() throws Exception {
        String token = registerAndLogin("invalid-recipe");

        RecipeRequest invalid = samplePestoRecipe();
        invalid.setTitle("");

        mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createRecipeWithoutAuthReturns401() throws Exception {
        mockMvc.perform(post("/api/recipes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ingredientCreatedThroughRecipeIsListedByIngredientEndpoint() throws Exception {
        String token = registerAndLogin("ingredient-check");

        mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/ingredients")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Basilic')]").isNotEmpty());
    }

    @Test
    void listAllRecipesIncludesRecipesFromAnyUser() throws Exception {
        String ownerToken = registerAndLogin("global-list-owner");
        String otherToken = registerAndLogin("global-list-reader");

        long recipeId = createRecipe(ownerToken, samplePestoRecipe());

        // /api/recipes (sans /mine ni /search) est volontairement global : consulté avec le
        // token d'un AUTRE utilisateur, il doit quand même remonter la recette.
        mockMvc.perform(get("/api/recipes")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + recipeId + ")]").isNotEmpty());
    }

    @Test
    void searchDoesNotIncludeOtherUsersRecipes() throws Exception {
        String user1Token = registerAndLogin("search-scope-1");
        String user2Token = registerAndLogin("search-scope-2");

        RecipeRequest recipe1 = samplePestoRecipe();
        recipe1.setTitle("Recette de user 1");
        recipe1.setIngredients(List.of(ingredient("Tomate", "kg", 1f)));
        long recipe1Id = createRecipe(user1Token, recipe1);

        RecipeRequest recipe2 = samplePestoRecipe();
        recipe2.setTitle("Recette de user 2");
        recipe2.setIngredients(List.of(ingredient("Tomate", "kg", 1f)));
        long recipe2Id = createRecipe(user2Token, recipe2);

        mockMvc.perform(get("/api/recipes/search")
                        .header("Authorization", "Bearer " + user1Token)
                        .param("ingredients", "Tomate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.recipe.id == " + recipe1Id + ")]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.recipe.id == " + recipe2Id + ")]").isEmpty());
    }

    @Test
    void suggestionsExcludeRecipeContainingDeclaredAllergen() throws Exception {
        String token = registerAndLogin("suggestions-allergen");

        RecipeRequest allergenRecipe = samplePestoRecipe();
        allergenRecipe.setTitle("Salade de cacahuètes");
        allergenRecipe.setIngredients(List.of(ingredient("Arachide", "g", 50f)));
        long allergenRecipeId = createRecipe(token, allergenRecipe);

        RecipeRequest safeRecipe = samplePestoRecipe();
        safeRecipe.setTitle("Recette sans allergène");
        safeRecipe.setIngredients(List.of(ingredient("Riz", "g", 200f)));
        long safeRecipeId = createRecipe(token, safeRecipe);

        UserPreferenceRequest preferences = new UserPreferenceRequest();
        preferences.setAllergies(List.of("Arachide"));
        setPreferences(token, preferences);

        mockMvc.perform(get("/api/recipes/suggestions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + allergenRecipeId + ")]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == " + safeRecipeId + ")]").isNotEmpty());
    }

    @Test
    void suggestionsExcludeRecipeExceedingMaxPreparationTime() throws Exception {
        String token = registerAndLogin("suggestions-max-time");

        RecipeRequest longRecipe = samplePestoRecipe();
        longRecipe.setTitle("Recette longue");
        longRecipe.setPreparationTime(90);
        long longRecipeId = createRecipe(token, longRecipe);

        RecipeRequest quickRecipe = samplePestoRecipe();
        quickRecipe.setTitle("Recette rapide");
        quickRecipe.setPreparationTime(10);
        long quickRecipeId = createRecipe(token, quickRecipe);

        UserPreferenceRequest preferences = new UserPreferenceRequest();
        preferences.setMaxPreparationTime(30);
        setPreferences(token, preferences);

        mockMvc.perform(get("/api/recipes/suggestions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + longRecipeId + ")]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == " + quickRecipeId + ")]").isNotEmpty());
    }

    @Test
    void suggestionsRankPreferredDietBeforeNonMatchingRecipes() throws Exception {
        String token = registerAndLogin("suggestions-diet-rank");

        RecipeRequest plainRecipe = samplePestoRecipe();
        plainRecipe.setTitle("Recette sans régime particulier");
        plainRecipe.setDiet(null);
        long plainRecipeId = createRecipe(token, plainRecipe);

        RecipeRequest veganRecipe = samplePestoRecipe();
        veganRecipe.setTitle("Recette végane");
        veganRecipe.setDiet("Végan");
        long veganRecipeId = createRecipe(token, veganRecipe);

        UserPreferenceRequest preferences = new UserPreferenceRequest();
        preferences.setDiet(List.of("Végan"));
        setPreferences(token, preferences);

        String response = mockMvc.perform(get("/api/recipes/suggestions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode results = objectMapper.readTree(response);
        int veganIndex = indexOfRecipeId(results, veganRecipeId);
        int plainIndex = indexOfRecipeId(results, plainRecipeId);

        assertThat(veganIndex).isGreaterThanOrEqualTo(0);
        assertThat(plainIndex).isGreaterThanOrEqualTo(0);
        assertThat(veganIndex).isLessThan(plainIndex);
    }
}
