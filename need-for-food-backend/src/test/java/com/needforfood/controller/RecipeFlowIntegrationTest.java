package com.needforfood.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RecipeIngredientRequest;
import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.request.RegisterRequest;
import com.needforfood.dto.request.UserPreferenceRequest;
import com.needforfood.model.document.RecipeSearchIndex;
import com.needforfood.repository.nosql.RecipeSearchIndexRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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

    @Autowired
    private RecipeSearchIndexRepository recipeSearchIndexRepository;

    @AfterEach
    void cleanUpMongo() {
        recipeSearchIndexRepository.deleteAll();
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
    void listAndDetailOnlyShowOwnAndFriendsRecipesNotStrangers() throws Exception {
        String ownerToken = registerAndLogin("visibility-owner");
        String friendToken = registerAndLogin("visibility-friend");
        String strangerToken = registerAndLogin("visibility-stranger");

        String createResponse = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long recipeId = objectMapper.readTree(createResponse).get("id").asLong();
        long ownerId = objectMapper.readTree(createResponse).get("userId").asLong();

        mockMvc.perform(get("/api/recipes")
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + recipeId + ")]").isEmpty());

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());

        String requestResponse = mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + friendToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + ownerId + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();

        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/recipes")
                        .header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + recipeId + ")]").isNotEmpty());

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk());
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
    void searchAndSuggestionsIncludeFriendsRecipesOnceAccepted() throws Exception {
        String ownerToken = registerAndLogin("search-friend-owner");
        String friendToken = registerAndLogin("search-friend-friend");

        RecipeRequest mangoRecipe = samplePestoRecipe();
        mangoRecipe.setTitle("Salade de mangue");
        mangoRecipe.setIngredients(List.of(ingredient("Mangue", "g", 200f)));
        String createResponse = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mangoRecipe)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long recipeId = objectMapper.readTree(createResponse).get("id").asLong();
        long ownerId = objectMapper.readTree(createResponse).get("userId").asLong();

        // Avant l'amitié : ni dans /search ni dans /suggestions.
        mockMvc.perform(get("/api/recipes/search")
                        .header("Authorization", "Bearer " + friendToken)
                        .param("ingredients", "Mangue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(get("/api/recipes/suggestions")
                        .header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + recipeId + ")]").isEmpty());

        String requestResponse = mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + friendToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + ownerId + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();
        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        // Après l'amitié : présente dans les deux, avec le nom du créateur.
        mockMvc.perform(get("/api/recipes/search")
                        .header("Authorization", "Bearer " + friendToken)
                        .param("ingredients", "Mangue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].recipe.id").value(recipeId))
                .andExpect(jsonPath("$[0].recipe.username").value("search-friend-owner"));
        mockMvc.perform(get("/api/recipes/suggestions")
                        .header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + recipeId + ")]").isNotEmpty());
    }

    @Test
    void listDeduplicatesIdenticalRecipesPreferringViewersOwnCopy() throws Exception {
        String ownerToken = registerAndLogin("dedup-owner");
        String friendToken = registerAndLogin("dedup-friend");

        String ownerCreateResponse = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long ownerRecipeId = objectMapper.readTree(ownerCreateResponse).get("id").asLong();
        long ownerId = objectMapper.readTree(ownerCreateResponse).get("userId").asLong();

        String friendCreateResponse = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + friendToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long friendRecipeId = objectMapper.readTree(friendCreateResponse).get("id").asLong();
        long friendId = objectMapper.readTree(friendCreateResponse).get("userId").asLong();

        String requestResponse = mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + friendToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + ownerId + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();

        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        // Chaque compte possède aussi une recette de bienvenue auto-générée, strictement
        // identique pour tous les utilisateurs : elle doit fusionner de la même façon que la
        // recette de pesto ci-dessus. Dans les deux cas, le viewer ne doit voir QUE sa propre
        // copie, jamais celle de son ami avec l'id/userId de ce dernier.
        String ownerList = mockMvc.perform(get("/api/recipes")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + ownerRecipeId + ")]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == " + friendRecipeId + ")]").isEmpty())
                .andReturn().getResponse().getContentAsString();
        JsonNode ownerResults = objectMapper.readTree(ownerList);
        for (JsonNode recipe : ownerResults) {
            assertThat(recipe.get("userId").asLong()).isEqualTo(ownerId);
        }

        String friendList = mockMvc.perform(get("/api/recipes")
                        .header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + friendRecipeId + ")]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == " + ownerRecipeId + ")]").isEmpty())
                .andReturn().getResponse().getContentAsString();
        JsonNode friendResults = objectMapper.readTree(friendList);
        for (JsonNode recipe : friendResults) {
            assertThat(recipe.get("userId").asLong()).isEqualTo(friendId);
        }
    }

    @Test
    void dedupeIgnoresImagesEvenWhenTheyDiffer() throws Exception {
        String ownerToken = registerAndLogin("dedup-images-owner");
        String friendToken = registerAndLogin("dedup-images-friend");

        String ownerCreateResponse = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long ownerRecipeId = objectMapper.readTree(ownerCreateResponse).get("id").asLong();
        long ownerId = objectMapper.readTree(ownerCreateResponse).get("userId").asLong();

        long friendRecipeId = createRecipe(friendToken, samplePestoRecipe());

        mockMvc.perform(multipart("/api/recipes/" + ownerRecipeId + "/images")
                        .file(new MockMultipartFile("files", "owner.jpg", "image/jpeg", new byte[]{1, 2, 3}))
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
        mockMvc.perform(multipart("/api/recipes/" + friendRecipeId + "/images")
                        .file(new MockMultipartFile("files", "friend.jpg", "image/jpeg", new byte[]{4, 5, 6, 7}))
                        .header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk());

        String requestResponse = mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + friendToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + ownerId + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();
        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        // Deux recettes de contenu identique mais avec des images différentes doivent quand même
        // fusionner : les images ne participent pas au fingerprint de dédoublonnage.
        mockMvc.perform(get("/api/recipes")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + ownerRecipeId + ")]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == " + friendRecipeId + ")]").isEmpty());
    }

    @Test
    void getByUserReturnsFullListEvenWhenIdenticalToViewersOwnRecipe() throws Exception {
        String ownerToken = registerAndLogin("byuser-owner");
        String friendToken = registerAndLogin("byuser-friend");
        String strangerToken = registerAndLogin("byuser-stranger");

        String ownerCreateResponse = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePestoRecipe())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long ownerRecipeId = objectMapper.readTree(ownerCreateResponse).get("id").asLong();
        long ownerId = objectMapper.readTree(ownerCreateResponse).get("userId").asLong();

        // Le viewer a lui aussi une copie strictement identique : sur GET /api/recipes (getAll),
        // ceci fusionnerait les deux (voir listDeduplicatesIdenticalRecipesPreferringViewersOwnCopy).
        // GET /api/recipes/user/{id} ne doit PAS appliquer cette déduplication : on demande
        // explicitement la liste de CETTE personne, elle doit rester complète.
        createRecipe(friendToken, samplePestoRecipe());

        String requestResponse = mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + friendToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + ownerId + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();
        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/recipes/user/" + ownerId)
                        .header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + ownerRecipeId + ")]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.userId == " + ownerId + ")]").isNotEmpty());

        mockMvc.perform(get("/api/recipes/user/" + ownerId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + ownerRecipeId + ")]").isNotEmpty());

        mockMvc.perform(get("/api/recipes/user/" + ownerId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());
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

    @Test
    void creatingRecipeSyncsRecipeSearchIndex() throws Exception {
        String token = registerAndLogin("search-index-create");
        long recipeId = createRecipe(token, samplePestoRecipe());

        RecipeSearchIndex index = recipeSearchIndexRepository.findByRecipeId(recipeId).orElseThrow();
        assertThat(index.getTitle()).isEqualTo("Pâtes au pesto");
        assertThat(index.getType()).isEqualTo("plat");
        assertThat(index.getDiet()).isEqualTo("vegetarien");
        assertThat(index.getIngredients()).contains("Basilic");
    }

    @Test
    void updatingRecipeSyncsRecipeSearchIndex() throws Exception {
        String token = registerAndLogin("search-index-update");
        long recipeId = createRecipe(token, samplePestoRecipe());

        RecipeRequest updateBody = samplePestoRecipe();
        updateBody.setTitle("Pâtes au pesto (v2)");

        mockMvc.perform(put("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateBody)))
                .andExpect(status().isOk());

        RecipeSearchIndex index = recipeSearchIndexRepository.findByRecipeId(recipeId).orElseThrow();
        assertThat(index.getTitle()).isEqualTo("Pâtes au pesto (v2)");
    }

    @Test
    void deletingRecipeRemovesItFromRecipeSearchIndex() throws Exception {
        String token = registerAndLogin("search-index-delete");
        long recipeId = createRecipe(token, samplePestoRecipe());

        mockMvc.perform(delete("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(recipeSearchIndexRepository.findByRecipeId(recipeId)).isEmpty();
    }
}
