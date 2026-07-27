package com.needforfood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.ChangePasswordRequest;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RegisterRequest;
import com.needforfood.dto.request.UpdateProfileRequest;
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
class UserFlowIntegrationTest {

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

    private String registerAndLogin(String emailPrefix, String password) throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail(emailPrefix + "@needforfood.dev");
        register.setUsername(emailPrefix);
        register.setPassword(password);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        return login(emailPrefix + "@needforfood.dev", password);
    }

    private String login(String email, String password) throws Exception {
        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setPassword(password);

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    @Test
    void updateProfileChangesNameEmailBioAndAvatar() throws Exception {
        String token = registerAndLogin("profile-update", "s3cret-pwd");

        UpdateProfileRequest update = new UpdateProfileRequest();
        update.setUsername("Nouveau Nom");
        update.setEmail("profile-update-new@needforfood.dev");
        update.setBio("Passionné de cuisine");
        update.setAvatarUrl("http://example.com/avatar.png");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("Nouveau Nom"))
                .andExpect(jsonPath("$.email").value("profile-update-new@needforfood.dev"))
                .andExpect(jsonPath("$.bio").value("Passionné de cuisine"))
                .andExpect(jsonPath("$.avatarUrl").value("http://example.com/avatar.png"));

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("Nouveau Nom"));
    }

    @Test
    void updateProfileRejectsDuplicateEmailWith409() throws Exception {
        registerAndLogin("existing-email", "s3cret-pwd");
        String otherToken = registerAndLogin("other-user", "s3cret-pwd");

        UpdateProfileRequest update = new UpdateProfileRequest();
        update.setEmail("existing-email@needforfood.dev");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isConflict());
    }

    @Test
    void changePasswordWithCorrectCurrentPasswordAllowsLoginWithNewPasswordOnly() throws Exception {
        String token = registerAndLogin("change-pwd", "old-password");

        ChangePasswordRequest change = new ChangePasswordRequest();
        change.setCurrentPassword("old-password");
        change.setNewPassword("new-password-123");

        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(change)))
                .andExpect(status().isNoContent());

        LoginRequest newLogin = new LoginRequest();
        newLogin.setEmail("change-pwd@needforfood.dev");
        newLogin.setPassword("new-password-123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk());

        LoginRequest oldLogin = new LoginRequest();
        oldLogin.setEmail("change-pwd@needforfood.dev");
        oldLogin.setPassword("old-password");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePasswordWithWrongCurrentPasswordReturns400() throws Exception {
        String token = registerAndLogin("wrong-current-pwd", "s3cret-pwd");

        ChangePasswordRequest change = new ChangePasswordRequest();
        change.setCurrentPassword("not-the-right-password");
        change.setNewPassword("new-password-123");

        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(change)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteAccountRemovesUserAndSubsequentAccessReturns404() throws Exception {
        String token = registerAndLogin("delete-account", "s3cret-pwd");

        mockMvc.perform(delete("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteAccountAlsoRemovesMongoPreferences() throws Exception {
        String token = registerAndLogin("delete-account-prefs", "s3cret-pwd");

        UserPreferenceRequest preferences = new UserPreferenceRequest();
        preferences.setDiet(List.of("Végétarien"));

        mockMvc.perform(put("/api/preferences/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(preferences)))
                .andExpect(status().isOk());

        String meResponse = mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString();
        long userId = objectMapper.readTree(meResponse).get("id").asLong();

        mockMvc.perform(delete("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(preferenceRepository.findByUserId(userId)).isEmpty();
    }
}
