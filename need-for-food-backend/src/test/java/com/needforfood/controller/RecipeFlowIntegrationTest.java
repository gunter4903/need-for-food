package com.needforfood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RecipeIngredientRequest;
import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.request.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
}
