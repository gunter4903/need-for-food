package com.needforfood.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RecipeIngredientRequest;
import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.request.RegisterRequest;
import org.hamcrest.Matchers;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class RecipeImageFlowIntegrationTest {

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
        recipe.setDescription("Rapide et savoureux");
        recipe.setType("plat");
        recipe.setPreparationTime(15);
        recipe.setIngredients(List.of(basil));
        recipe.setSteps(List.of("Cuire les pâtes", "Mixer le pesto"));

        String response = mockMvc.perform(post("/api/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recipe)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private MockMultipartFile jpegFile(String name, int sizeBytes) {
        byte[] content = new byte[sizeBytes];
        content[0] = (byte) 0xFF; // pas un vrai JPEG, mais le content-type déclaré suffit ici
        return new MockMultipartFile("files", name, "image/jpeg", content);
    }

    @Test
    void uploadingOneImageReturnsItInTheImagesList() throws Exception {
        String token = registerAndLogin("image-upload-one");
        long recipeId = createRecipe(token);

        mockMvc.perform(multipart("/api/recipes/" + recipeId + "/images")
                        .file(jpegFile("photo.jpg", 100))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images.length()").value(1))
                .andExpect(jsonPath("$.images[0].url", Matchers.containsString("/uploads/recipes/")));
    }

    @Test
    void uploadingSeveralImagesInOneRequestOrdersThemByPosition() throws Exception {
        String token = registerAndLogin("image-upload-many");
        long recipeId = createRecipe(token);

        mockMvc.perform(multipart("/api/recipes/" + recipeId + "/images")
                        .file(jpegFile("a.jpg", 50))
                        .file(jpegFile("b.jpg", 50))
                        .file(jpegFile("c.jpg", 50))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images.length()").value(3))
                .andExpect(jsonPath("$.images[0].position").value(0))
                .andExpect(jsonPath("$.images[1].position").value(1))
                .andExpect(jsonPath("$.images[2].position").value(2));
    }

    @Test
    void uploadingMoreThanFiveImagesTotalIsRejected() throws Exception {
        String token = registerAndLogin("image-upload-limit");
        long recipeId = createRecipe(token);

        mockMvc.perform(multipart("/api/recipes/" + recipeId + "/images")
                        .file(jpegFile("1.jpg", 50)).file(jpegFile("2.jpg", 50))
                        .file(jpegFile("3.jpg", 50)).file(jpegFile("4.jpg", 50))
                        .file(jpegFile("5.jpg", 50))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images.length()").value(5));

        mockMvc.perform(multipart("/api/recipes/" + recipeId + "/images")
                        .file(jpegFile("6.jpg", 50))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images.length()").value(5));
    }

    @Test
    void uploadingDisallowedContentTypeIsRejected() throws Exception {
        String token = registerAndLogin("image-upload-badtype");
        long recipeId = createRecipe(token);

        MockMultipartFile pdf = new MockMultipartFile("files", "doc.pdf", "application/pdf", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/recipes/" + recipeId + "/images")
                        .file(pdf)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images.length()").value(0));
    }

    @Test
    void nonOwnerCannotUploadImages() throws Exception {
        String ownerToken = registerAndLogin("image-owner");
        String strangerToken = registerAndLogin("image-stranger");
        long recipeId = createRecipe(ownerToken);

        mockMvc.perform(multipart("/api/recipes/" + recipeId + "/images")
                        .file(jpegFile("photo.jpg", 50))
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerCanDeleteAnExistingImage() throws Exception {
        String token = registerAndLogin("image-delete");
        long recipeId = createRecipe(token);

        String uploadResponse = mockMvc.perform(multipart("/api/recipes/" + recipeId + "/images")
                        .file(jpegFile("photo.jpg", 50))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode images = objectMapper.readTree(uploadResponse).get("images");
        long imageId = images.get(0).get("id").asLong();

        mockMvc.perform(delete("/api/recipes/" + recipeId + "/images/" + imageId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/recipes/" + recipeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images.length()").value(0));
    }

    @Test
    void nonOwnerCannotDeleteAnImage() throws Exception {
        String ownerToken = registerAndLogin("image-delete-owner");
        String strangerToken = registerAndLogin("image-delete-stranger");
        long recipeId = createRecipe(ownerToken);

        String uploadResponse = mockMvc.perform(multipart("/api/recipes/" + recipeId + "/images")
                        .file(jpegFile("photo.jpg", 50))
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long imageId = objectMapper.readTree(uploadResponse).get("images").get(0).get("id").asLong();

        mockMvc.perform(delete("/api/recipes/" + recipeId + "/images/" + imageId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void welcomeRecipeHasExactlyOneSeededImage() throws Exception {
        String token = registerAndLogin("image-welcome");

        mockMvc.perform(get("/api/recipes/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].images.length()").value(1))
                .andExpect(jsonPath("$[0].images[0].url", Matchers.containsString("/images/pates-au-beurre.png")));
    }
}
