package com.needforfood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RecipeIngredientRequest;
import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.request.RegisterRequest;
import com.needforfood.dto.request.ShoppingListGenerateRequest;
import com.needforfood.dto.request.ShoppingListItemCheckRequest;
import com.needforfood.dto.request.ShoppingListItemRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class ShoppingListFlowIntegrationTest {

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

    private long createRecipe(String token, String title, RecipeIngredientRequest... ingredients) throws Exception {
        RecipeRequest recipe = new RecipeRequest();
        recipe.setTitle(title);
        recipe.setPreparationTime(10);
        recipe.setIngredients(List.of(ingredients));
        recipe.setSteps(List.of("Étape unique"));

        String response = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recipe)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private RecipeIngredientRequest ingredient(String name, String unit, float quantity) {
        RecipeIngredientRequest request = new RecipeIngredientRequest();
        request.setIngredientName(name);
        request.setUnit(unit);
        request.setQuantity(quantity);
        return request;
    }

    @Test
    void generateFromRecipesMergesDuplicateIngredientQuantities() throws Exception {
        String token = registerAndLogin("shopper");

        long recipe1 = createRecipe(token, "Sauce tomate", ingredient("Tomate", "kg", 2f));
        long recipe2 = createRecipe(token, "Salade", ingredient("Tomate", "kg", 1f), ingredient("Basilic", "g", 10f));

        ShoppingListGenerateRequest generate = new ShoppingListGenerateRequest();
        generate.setName("Courses de la semaine");
        generate.setRecipeIds(List.of(recipe1, recipe2));

        mockMvc.perform(post("/api/shopping-lists/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(generate)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[?(@.name == 'Tomate')].quantity").value(3.0))
                .andExpect(jsonPath("$.items[?(@.name == 'Basilic')].quantity").value(10.0));
    }

    @Test
    void addItemMergesQuantityWhenIngredientAlreadyPresentThenCheckAndRemove() throws Exception {
        String token = registerAndLogin("list-editor");

        long recipeId = createRecipe(token, "Pain maison", ingredient("Farine", "g", 500f));

        ShoppingListGenerateRequest generate = new ShoppingListGenerateRequest();
        generate.setName("Ma liste");
        generate.setRecipeIds(List.of(recipeId));

        String createResponse = mockMvc.perform(post("/api/shopping-lists/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(generate)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long listId = objectMapper.readTree(createResponse).get("id").asLong();

        ShoppingListItemRequest addFarine = new ShoppingListItemRequest();
        addFarine.setIngredientName("Farine");
        addFarine.setUnit("g");
        addFarine.setQuantity(200f);

        String afterAdd = mockMvc.perform(post("/api/shopping-lists/" + listId + "/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addFarine)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].quantity").value(700.0))
                .andReturn().getResponse().getContentAsString();

        long ingredientId = objectMapper.readTree(afterAdd).get("items").get(0).get("ingredientId").asLong();

        ShoppingListItemCheckRequest check = new ShoppingListItemCheckRequest();
        check.setChecked(true);

        mockMvc.perform(patch("/api/shopping-lists/" + listId + "/items/" + ingredientId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(check)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].checked").value(true));

        mockMvc.perform(delete("/api/shopping-lists/" + listId + "/items/" + ingredientId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void nonOwnerCannotAccessSomeoneElsesShoppingList() throws Exception {
        String ownerToken = registerAndLogin("list-owner");
        String strangerToken = registerAndLogin("list-stranger");

        long recipeId = createRecipe(ownerToken, "Omelette", ingredient("Oeuf", "unité", 3f));

        ShoppingListGenerateRequest generate = new ShoppingListGenerateRequest();
        generate.setName("Liste privée");
        generate.setRecipeIds(List.of(recipeId));

        String createResponse = mockMvc.perform(post("/api/shopping-lists/generate")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(generate)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long listId = objectMapper.readTree(createResponse).get("id").asLong();

        mockMvc.perform(get("/api/shopping-lists/" + listId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/shopping-lists/" + listId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void generateWithEmptyRecipeListReturns400() throws Exception {
        String token = registerAndLogin("list-validation");

        ShoppingListGenerateRequest generate = new ShoppingListGenerateRequest();
        generate.setName("Liste vide");
        generate.setRecipeIds(List.of());

        mockMvc.perform(post("/api/shopping-lists/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(generate)))
                .andExpect(status().isBadRequest());
    }
}
