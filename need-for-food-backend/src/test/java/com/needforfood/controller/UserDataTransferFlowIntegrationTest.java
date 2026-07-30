package com.needforfood.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.UserDataPayload;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class UserDataTransferFlowIntegrationTest {

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

    private long createRecipe(String token, String title) throws Exception {
        RecipeIngredientRequest flour = new RecipeIngredientRequest();
        flour.setIngredientName("Farine-udt");
        flour.setUnit("g");
        flour.setQuantity(200f);

        RecipeRequest recipe = new RecipeRequest();
        recipe.setTitle(title);
        recipe.setDifficulty("Facile");
        recipe.setPreparationTime(10);
        recipe.setIngredients(List.of(flour));
        recipe.setSteps(List.of("Mélanger"));

        String response = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recipe)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private UserDataPayload exportData(String token) throws Exception {
        byte[] response = mockMvc.perform(get("/api/users/me/export")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();

        return objectMapper.readValue(response, UserDataPayload.class);
    }

    @Test
    void exportIncludesProfileRecipesFavoritesAndShoppingLists() throws Exception {
        String token = registerAndLogin("udt-export");
        long recipeId = createRecipe(token, "UDT Export Recipe");

        mockMvc.perform(post("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/shopping-lists")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"UDT Export List\"}"))
                .andExpect(status().isCreated());

        String response = mockMvc.perform(get("/api/users/me/export")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("profile").get("username").asText()).isEqualTo("udt-export");
        assertThat(json.get("recipes").findValuesAsText("title")).contains("UDT Export Recipe");
        assertThat(json.get("favorites").findValuesAsText("title")).contains("UDT Export Recipe");
        assertThat(json.get("shoppingLists").findValuesAsText("name")).contains("UDT Export List");
    }

    @Test
    void exportRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/me/export")).andExpect(status().isUnauthorized());
    }

    @Test
    void reimportingSameExportDoesNotDuplicateRecipesFavoritesOrShoppingLists() throws Exception {
        String token = registerAndLogin("udt-roundtrip");
        long recipeId = createRecipe(token, "UDT Roundtrip Recipe");
        mockMvc.perform(post("/api/recipes/" + recipeId + "/favorite")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/shopping-lists")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"UDT Roundtrip List\"}"))
                .andExpect(status().isCreated());

        UserDataPayload payload = exportData(token);
        int ownRecipesBefore = payload.getRecipes().size();
        int shoppingListsBefore = payload.getShoppingLists().size();

        mockMvc.perform(post("/api/users/me/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipesImported").value(0))
                .andExpect(jsonPath("$.recipesSkipped").value(ownRecipesBefore))
                .andExpect(jsonPath("$.favoritesImported").value(1))
                .andExpect(jsonPath("$.favoritesSkipped").value(0))
                .andExpect(jsonPath("$.shoppingListsImported").value(0))
                .andExpect(jsonPath("$.shoppingListsSkipped").value(shoppingListsBefore));

        mockMvc.perform(get("/api/recipes/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(ownRecipesBefore));

        mockMvc.perform(get("/api/shopping-lists/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(shoppingListsBefore));
    }

    @Test
    void importCreatesNewShoppingListWhenNotAlreadyPresentButSkipsIdenticalOne() throws Exception {
        String token = registerAndLogin("udt-list-dedupe");

        UserDataPayload.ShoppingListItemData item = UserDataPayload.ShoppingListItemData.builder()
                .ingredientName("Riz-udt").unit("g").quantity(300f).checked(false).build();
        UserDataPayload.ShoppingListData listData = UserDataPayload.ShoppingListData.builder()
                .name("UDT Brand New List")
                .items(List.of(item))
                .build();
        UserDataPayload payload = UserDataPayload.builder().shoppingLists(List.of(listData)).build();

        mockMvc.perform(post("/api/users/me/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shoppingListsImported").value(1))
                .andExpect(jsonPath("$.shoppingListsSkipped").value(0));

        mockMvc.perform(post("/api/users/me/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shoppingListsImported").value(0))
                .andExpect(jsonPath("$.shoppingListsSkipped").value(1));

        String listsResponse = mockMvc.perform(get("/api/shopping-lists/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode lists = objectMapper.readTree(listsResponse);
        long matchingCount = 0;
        for (JsonNode list : lists) {
            if (list.get("name").asText().equals("UDT Brand New List")) {
                matchingCount++;
            }
        }
        assertThat(matchingCount).isEqualTo(1);
    }

    @Test
    void importCreatesNewRecipeWhenNotAlreadyPresent() throws Exception {
        String token = registerAndLogin("udt-newrecipe");

        UserDataPayload.IngredientData ingredient = UserDataPayload.IngredientData.builder()
                .name("Chocolat-udt").unit("g").quantity(100f).build();
        UserDataPayload.RecipeData newRecipe = UserDataPayload.RecipeData.builder()
                .title("UDT Brand New Recipe")
                .difficulty("Moyen")
                .preparationTime(20)
                .ingredients(List.of(ingredient))
                .steps(List.of("Faire fondre"))
                .build();
        UserDataPayload payload = UserDataPayload.builder()
                .recipes(List.of(newRecipe))
                .build();

        mockMvc.perform(post("/api/users/me/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipesImported").value(1))
                .andExpect(jsonPath("$.recipesSkipped").value(0));

        mockMvc.perform(get("/api/recipes/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.title == 'UDT Brand New Recipe')]").isNotEmpty());
    }

    @Test
    void importOnlyUpdatesBioAndAvatarNeverUsernameOrEmail() throws Exception {
        String token = registerAndLogin("udt-profile");

        UserDataPayload.ProfileData profile = UserDataPayload.ProfileData.builder()
                .username("someone-else")
                .email("hijacked@needforfood.dev")
                .bio("Nouvelle bio importée")
                .build();
        UserDataPayload payload = UserDataPayload.builder().profile(profile).build();

        mockMvc.perform(post("/api/users/me/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileUpdated").value(true));

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("udt-profile"))
                .andExpect(jsonPath("$.email").value("udt-profile@needforfood.dev"))
                .andExpect(jsonPath("$.bio").value("Nouvelle bio importée"));
    }

    @Test
    void importPreferencesReplacesExistingOnes() throws Exception {
        String token = registerAndLogin("udt-prefs");

        UserDataPayload.PreferencesData preferences = UserDataPayload.PreferencesData.builder()
                .diet(List.of("Végétarien"))
                .allergies(List.of("Arachide"))
                .dislikedIngredients(List.of())
                .favoriteRecipeTypes(List.of("Dessert"))
                .maxPreparationTime(30)
                .build();
        UserDataPayload payload = UserDataPayload.builder().preferences(preferences).build();

        mockMvc.perform(post("/api/users/me/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferencesImported").value(true));

        mockMvc.perform(get("/api/preferences/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diet[0]").value("Végétarien"))
                .andExpect(jsonPath("$.allergies[0]").value("Arachide"))
                .andExpect(jsonPath("$.maxPreparationTime").value(30));
    }

    @Test
    void importOfEmptyPayloadIsANoOp() throws Exception {
        String token = registerAndLogin("udt-empty");

        mockMvc.perform(post("/api/users/me/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileUpdated").value(false))
                .andExpect(jsonPath("$.preferencesImported").value(false))
                .andExpect(jsonPath("$.recipesImported").value(0))
                .andExpect(jsonPath("$.shoppingListsImported").value(0));
    }

    @Test
    void importRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/users/me/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
