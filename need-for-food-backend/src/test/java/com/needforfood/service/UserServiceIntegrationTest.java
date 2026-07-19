package com.needforfood.service;

import com.needforfood.exception.custom.DuplicateEmailException;
import com.needforfood.model.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class UserServiceIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void registersUserWithHashedPassword() {
        User user = userService.register("julia@needforfood.dev", "julia", "s3cret-pwd");

        assertThat(user.getId()).isNotNull();
        assertThat(user.getPasswordHash()).isNotEqualTo("s3cret-pwd");
        assertThat(passwordEncoder.matches("s3cret-pwd", user.getPasswordHash())).isTrue();
    }

    @Test
    void rejectsDuplicateEmail() {
        userService.register("duplicate@needforfood.dev", "first", "pwd");

        assertThatThrownBy(() -> userService.register("duplicate@needforfood.dev", "second", "pwd"))
                .isInstanceOf(DuplicateEmailException.class);
    }

    @Test
    void updatesProfileUsername() {
        User user = userService.register("profile@needforfood.dev", "old-name", "pwd");

        User updated = userService.updateProfile(user.getId(), "new-name", null);

        assertThat(updated.getUsername()).isEqualTo("new-name");
        assertThat(updated.getEmail()).isEqualTo("profile@needforfood.dev");
    }
}
