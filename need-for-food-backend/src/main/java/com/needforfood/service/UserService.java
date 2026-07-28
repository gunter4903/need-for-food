package com.needforfood.service;

import com.needforfood.exception.custom.DuplicateEmailException;
import com.needforfood.exception.custom.InvalidPasswordException;
import com.needforfood.exception.custom.InvalidVerificationCodeException;
import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.model.entity.User;
import com.needforfood.repository.nosql.UserPreferenceRepository;
import com.needforfood.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.mail.verification-code-expiration-minutes}")
    private long verificationCodeExpirationMinutes;

    @Transactional
    public User register(String email, String username, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException(email);
        }

        User user = User.builder()
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .verified(false)
                .verificationCode(generateVerificationCode())
                .verificationCodeExpiresAt(LocalDateTime.now().plusMinutes(verificationCodeExpirationMinutes))
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User verifyAccount(String email, String code) {
        User user = getByEmail(email);

        if (user.isVerified()) {
            return user;
        }

        boolean codeMatches = user.getVerificationCode() != null && user.getVerificationCode().equals(code);
        boolean notExpired = user.getVerificationCodeExpiresAt() != null
                && user.getVerificationCodeExpiresAt().isAfter(LocalDateTime.now());

        if (!codeMatches || !notExpired) {
            throw new InvalidVerificationCodeException();
        }

        user.setVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);
        return user;
    }

    @Transactional
    public String regenerateVerificationCode(String email) {
        User user = getByEmail(email);
        String code = generateVerificationCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(verificationCodeExpirationMinutes));
        return code;
    }

    private String generateVerificationCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + id));
    }

    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + email));
    }

    @Transactional
    public User updateProfile(Long id, String username, String email, String bio, String avatarUrl) {
        User user = getById(id);

        if (email != null && !email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException(email);
        }

        if (username != null) {
            user.setUsername(username);
        }
        if (email != null) {
            user.setEmail(email);
        }
        if (bio != null) {
            user.setBio(bio);
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl.isBlank() ? null : avatarUrl);
        }

        return user;
    }

    @Transactional
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = getById(id);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new InvalidPasswordException("Mot de passe actuel incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    @Transactional(readOnly = true)
    public List<User> search(Long requesterId, String query) {
        Map<Long, User> results = new LinkedHashMap<>();
        userRepository.findTop20ByUsernameContainingIgnoreCaseAndIdNot(query, requesterId)
                .forEach(user -> results.put(user.getId(), user));

        if (query.contains("@")) {
            userRepository.findByEmail(query)
                    .filter(user -> !user.getId().equals(requesterId))
                    .ifPresent(user -> results.put(user.getId(), user));
        }

        return new ArrayList<>(results.values());
    }

    @Transactional
    public void deleteAccount(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Utilisateur introuvable: " + id);
        }
        userRepository.deleteById(id);
        preferenceRepository.deleteByUserId(id);
    }
}
