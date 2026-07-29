package com.needforfood.controller;

import com.fasterxml.jackson.databind.JsonNode;
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
class FriendshipFlowIntegrationTest {

    private record Session(String token, long userId) {
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Session registerAndLogin(String emailPrefix) throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail(emailPrefix + "@needforfood.dev");
        register.setUsername(emailPrefix);
        register.setPassword("s3cret-pwd");

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long userId = objectMapper.readTree(registerResponse).get("id").asLong();

        LoginRequest login = new LoginRequest();
        login.setEmail(register.getEmail());
        login.setPassword("s3cret-pwd");

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return new Session(objectMapper.readTree(loginResponse).get("token").asText(), userId);
    }

    private long sendRequest(String fromToken, long toUserId) throws Exception {
        String response = mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + fromToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + toUserId + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    @Test
    void sendAcceptThenAppearInEachOthersFriendsList() throws Exception {
        Session alice = registerAndLogin("fs-alice");
        Session bob = registerAndLogin("fs-bob");

        long friendshipId = sendRequest(bob.token(), alice.userId());

        mockMvc.perform(get("/api/friends/requests/received")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].requester.username").value("fs-bob"));

        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        mockMvc.perform(get("/api/friends")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("fs-bob"));

        mockMvc.perform(get("/api/friends")
                        .header("Authorization", "Bearer " + bob.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("fs-alice"));
    }

    @Test
    void sendingAMutualRequestAutoAcceptsInstead() throws Exception {
        Session alice = registerAndLogin("fs-mutual-a");
        Session bob = registerAndLogin("fs-mutual-b");

        sendRequest(alice.token(), bob.userId());
        mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + bob.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + alice.userId() + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        mockMvc.perform(get("/api/friends")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void cannotSendRequestToSelfOrDuplicate() throws Exception {
        Session alice = registerAndLogin("fs-self");
        Session bob = registerAndLogin("fs-dup-target");

        mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + alice.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + alice.userId() + "}"))
                .andExpect(status().isBadRequest());

        sendRequest(alice.token(), bob.userId());

        mockMvc.perform(post("/api/friends/requests")
                        .header("Authorization", "Bearer " + alice.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + bob.userId() + "}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void onlyAddresseeCanAcceptAndAcceptingTwiceFails() throws Exception {
        Session alice = registerAndLogin("fs-accept-a");
        Session bob = registerAndLogin("fs-accept-b");
        Session carol = registerAndLogin("fs-accept-c");

        long friendshipId = sendRequest(bob.token(), alice.userId());

        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + carol.token()))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectingARequestRemovesItAndAllowsANewOneLater() throws Exception {
        Session alice = registerAndLogin("fs-reject-a");
        Session bob = registerAndLogin("fs-reject-b");

        long friendshipId = sendRequest(bob.token(), alice.userId());

        mockMvc.perform(delete("/api/friends/requests/" + friendshipId)
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/friends/requests/received")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        sendRequest(bob.token(), alice.userId());
    }

    @Test
    void unfriendRemovesTheRelationshipBothWays() throws Exception {
        Session alice = registerAndLogin("fs-unfriend-a");
        Session bob = registerAndLogin("fs-unfriend-b");

        long friendshipId = sendRequest(bob.token(), alice.userId());
        mockMvc.perform(put("/api/friends/requests/" + friendshipId + "/accept")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/friends/" + bob.userId())
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/friends")
                        .header("Authorization", "Bearer " + alice.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/friends")
                        .header("Authorization", "Bearer " + bob.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void searchFindsByPartialUsernameOrExactEmailAndExcludesSelf() throws Exception {
        Session alice = registerAndLogin("fs-search-a");
        registerAndLogin("fs-search-findme");

        String response = mockMvc.perform(get("/api/users/search")
                        .header("Authorization", "Bearer " + alice.token())
                        .param("q", "search-findme"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode results = objectMapper.readTree(response);
        boolean foundTarget = false;
        boolean foundSelf = false;
        for (JsonNode result : results) {
            String username = result.get("user").get("username").asText();
            if (username.equals("fs-search-findme")) {
                foundTarget = true;
                assertThat(result.get("friendshipStatus").asText()).isEqualTo("NONE");
            }
            if (username.equals("fs-search-a")) {
                foundSelf = true;
            }
        }
        assertThat(foundTarget).isTrue();
        assertThat(foundSelf).isFalse();

        mockMvc.perform(get("/api/users/search")
                        .header("Authorization", "Bearer " + alice.token())
                        .param("q", "fs-search-findme@needforfood.dev"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.user.username == 'fs-search-findme')]").isNotEmpty());
    }

    @Test
    void searchIgnoresAccentsAndCase() throws Exception {
        Session alice = registerAndLogin("fs-search-accent-a");

        RegisterRequest register = new RegisterRequest();
        register.setEmail("fs-search-accent-target@needforfood.dev");
        register.setUsername("ZzTestGérard");
        register.setPassword("s3cret-pwd");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/users/search")
                        .header("Authorization", "Bearer " + alice.token())
                        .param("q", "zztestGE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.user.username == 'ZzTestGérard')]").isNotEmpty());
    }

    @Test
    void requestsAndFriendsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/friends")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/search").param("q", "x")).andExpect(status().isUnauthorized());
    }
}
