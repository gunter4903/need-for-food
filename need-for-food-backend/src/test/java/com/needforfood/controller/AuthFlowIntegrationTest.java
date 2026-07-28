package com.needforfood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.needforfood.dto.request.LoginRequest;
import com.needforfood.dto.request.RegisterRequest;
import com.needforfood.dto.request.ResendVerificationRequest;
import com.needforfood.dto.request.VerifyAccountRequest;
import com.needforfood.model.entity.User;
import com.needforfood.repository.sql.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
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

    @Autowired
    private UserRepository userRepository;

    private void register(String email, String username, String password) throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail(email);
        register.setUsername(username);
        register.setPassword(password);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());
    }

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

    @Test
    void registerCreatesAnUnverifiedAccountWithAPendingVerificationCode() throws Exception {
        register("unverified@needforfood.dev", "unverified-user", "s3cret-pwd");

        User user = userRepository.findByEmail("unverified@needforfood.dev").orElseThrow();
        assertThat(user.isVerified()).isFalse();
        assertThat(user.getVerificationCode()).matches("\\d{6}");
        assertThat(user.getVerificationCodeExpiresAt()).isNotNull();
    }

    @Test
    void verifyAccountWithCorrectCodeMarksItVerifiedAndReturnsAToken() throws Exception {
        register("verify@needforfood.dev", "verify-user", "s3cret-pwd");
        String code = userRepository.findByEmail("verify@needforfood.dev").orElseThrow().getVerificationCode();

        VerifyAccountRequest verify = new VerifyAccountRequest();
        verify.setEmail("verify@needforfood.dev");
        verify.setCode(code);

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        User verified = userRepository.findByEmail("verify@needforfood.dev").orElseThrow();
        assertThat(verified.isVerified()).isTrue();
        assertThat(verified.getVerificationCode()).isNull();
        assertThat(verified.getVerificationCodeExpiresAt()).isNull();
    }

    @Test
    void verifyAccountWithWrongCodeReturns400AndLeavesAccountUnverified() throws Exception {
        register("wrongcode@needforfood.dev", "wrongcode-user", "s3cret-pwd");
        String actualCode = userRepository.findByEmail("wrongcode@needforfood.dev").orElseThrow().getVerificationCode();
        String wrongCode = actualCode.equals("111111") ? "222222" : "111111";

        VerifyAccountRequest verify = new VerifyAccountRequest();
        verify.setEmail("wrongcode@needforfood.dev");
        verify.setCode(wrongCode);

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findByEmail("wrongcode@needforfood.dev").orElseThrow().isVerified()).isFalse();
    }

    @Test
    void resendVerificationGeneratesANewCode() throws Exception {
        register("resend@needforfood.dev", "resend-user", "s3cret-pwd");
        String oldCode = userRepository.findByEmail("resend@needforfood.dev").orElseThrow().getVerificationCode();

        ResendVerificationRequest resend = new ResendVerificationRequest();
        resend.setEmail("resend@needforfood.dev");

        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resend)))
                .andExpect(status().isNoContent());

        User user = userRepository.findByEmail("resend@needforfood.dev").orElseThrow();
        assertThat(user.isVerified()).isFalse();
        assertThat(user.getVerificationCode()).isNotEqualTo(oldCode);
    }
}
