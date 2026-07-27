package com.needforfood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RegisterRequest;
import com.needforfood.dto.request.UserPreferenceRequest;
import com.needforfood.repository.nosql.UserPreferenceRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class PreferenceFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Mongo n'est pas couvert par le rollback @Transactional (celui-ci ne gère que PostgreSQL) :
    // nettoyage manuel nécessaire, comme dans MongoRepositoriesIntegrationTest.
    @Autowired
    private UserPreferenceRepository preferenceRepository;

    @AfterEach
    void cleanUp() {
        preferenceRepository.deleteAll();
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

    @Test
    void getMineReturnsEmptyDefaultsWhenNothingSaved() throws Exception {
        String token = registerAndLogin("prefs-default");

        mockMvc.perform(get("/api/preferences/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diet").isEmpty())
                .andExpect(jsonPath("$.allergies").isEmpty())
                .andExpect(jsonPath("$.dislikedIngredients").isEmpty())
                .andExpect(jsonPath("$.favoriteRecipeTypes").isEmpty())
                .andExpect(jsonPath("$.maxPreparationTime").isEmpty());
    }

    @Test
    void updateMinePersistsAllFields() throws Exception {
        String token = registerAndLogin("prefs-update");

        UserPreferenceRequest request = new UserPreferenceRequest();
        request.setDiet(List.of("Végétarien"));
        request.setAllergies(List.of("Arachide"));
        request.setDislikedIngredients(List.of("Coriandre"));
        request.setFavoriteRecipeTypes(List.of("Dessert"));
        request.setMaxPreparationTime(30);

        mockMvc.perform(put("/api/preferences/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diet[0]").value("Végétarien"))
                .andExpect(jsonPath("$.allergies[0]").value("Arachide"))
                .andExpect(jsonPath("$.dislikedIngredients[0]").value("Coriandre"))
                .andExpect(jsonPath("$.favoriteRecipeTypes[0]").value("Dessert"))
                .andExpect(jsonPath("$.maxPreparationTime").value(30));

        mockMvc.perform(get("/api/preferences/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diet[0]").value("Végétarien"))
                .andExpect(jsonPath("$.maxPreparationTime").value(30));
    }

    @Test
    void updateMineFullyReplacesPreviousValues() throws Exception {
        String token = registerAndLogin("prefs-replace");

        UserPreferenceRequest first = new UserPreferenceRequest();
        first.setDiet(List.of("Végétarien"));
        first.setAllergies(List.of("Arachide"));

        mockMvc.perform(put("/api/preferences/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isOk());

        UserPreferenceRequest second = new UserPreferenceRequest();
        second.setDiet(List.of("Végan"));

        mockMvc.perform(put("/api/preferences/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diet[0]").value("Végan"))
                .andExpect(jsonPath("$.allergies").isEmpty());
    }

    @Test
    void protectedRouteRejectsMissingTokenWith401() throws Exception {
        mockMvc.perform(get("/api/preferences/me"))
                .andExpect(status().isUnauthorized());
    }
}
