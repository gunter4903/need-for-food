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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class RecipeFavoriteFlowIntegrationTest {

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

    private long createRecipe(String token) throws Exception {
        RecipeIngredientRequest basil = new RecipeIngredientRequest();
        basil.setIngredientName("Basilic");
        basil.setUnit("g");
        basil.setQuantity(20f);

        RecipeRequest recipe = new RecipeRequest();
        recipe.setTitle("Pâtes au pesto");
        recipe.setPreparationTime(15);
        recipe.setIngredients(List.of(basil));
        recipe.setSteps(List.of("Cuire les pâtes"));

        String response = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recipe)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.favorite").value(false))
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    @Test
    void addingFavoriteMarksRecipeAsFavoriteEverywhereItAppears() throws Exception {
        String token = registerAndLogin("favorite-add");
        long recipeId = createRecipe(token);

        mockMvc.perform(post("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorite").value(true));

        mockMvc.perform(get("/api/recipes/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + recipeId + ")].favorite").value(true));

        mockMvc.perform(get("/api/recipes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + recipeId + ")].favorite").value(true));
    }

    @Test
    void removingFavoriteUnmarksIt() throws Exception {
        String token = registerAndLogin("favorite-remove");
        long recipeId = createRecipe(token);

        mockMvc.perform(post("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorite").value(false));
    }

    @Test
    void addingFavoriteTwiceIsIdempotent() throws Exception {
        String token = registerAndLogin("favorite-idempotent");
        long recipeId = createRecipe(token);

        mockMvc.perform(post("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorite").value(true));
    }

    @Test
    void removingAFavoriteThatWasNeverAddedIsANoOp() throws Exception {
        String token = registerAndLogin("favorite-remove-noop");
        long recipeId = createRecipe(token);

        mockMvc.perform(delete("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void cannotFavoriteAStrangersRecipe() throws Exception {
        String ownerToken = registerAndLogin("favorite-owner");
        String strangerToken = registerAndLogin("favorite-stranger");
        long recipeId = createRecipe(ownerToken);

        mockMvc.perform(post("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void favoriteRequiresAuthentication() throws Exception {
        String token = registerAndLogin("favorite-auth");
        long recipeId = createRecipe(token);

        mockMvc.perform(post("/api/recipes/" + recipeId + "/favorite"))
                .andExpect(status().isUnauthorized());
    }
}
