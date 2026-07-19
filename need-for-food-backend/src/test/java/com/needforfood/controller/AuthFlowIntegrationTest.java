package com.needforfood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void fullAuthFlow_registerLoginThenAccessProtectedRoute() throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail("flow@needforfood.dev");
        register.setUsername("flow-user");
        register.setPassword("s3cret-pwd");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("flow@needforfood.dev"))
                .andExpect(jsonPath("$.username").value("flow-user"));

        LoginRequest login = new LoginRequest();
        login.setEmail("flow@needforfood.dev");
        login.setPassword("s3cret-pwd");

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("token").asText();

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("flow@needforfood.dev"));
    }

    @Test
    void registerRejectsDuplicateEmailWith409() throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail("dup@needforfood.dev");
        register.setUsername("dup-user");
        register.setPassword("s3cret-pwd");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isConflict());
    }

    @Test
    void loginRejectsWrongPasswordWith401() throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail("wrongpwd@needforfood.dev");
        register.setUsername("wrongpwd-user");
        register.setPassword("correct-pwd");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest();
        login.setEmail("wrongpwd@needforfood.dev");
        login.setPassword("wrong-pwd");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRouteRejectsMissingTokenWith401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRouteRejectsInvalidTokenWith401() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer not-a-valid-token"))
                .andExpect(status().isUnauthorized());
    }
}
