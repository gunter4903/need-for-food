package com.needforfood.service;

import com.needforfood.model.entity.User;
import com.needforfood.repository.sql.UserRepository;
import com.needforfood.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "Email ou mot de passe incorrect";

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public User register(String email, String username, String rawPassword) {
        return userService.register(email, username, rawPassword);
    }

    @Transactional(readOnly = true)
    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);
        }

        return jwtTokenProvider.generateToken(user.getId(), user.getEmail());
    }
}
