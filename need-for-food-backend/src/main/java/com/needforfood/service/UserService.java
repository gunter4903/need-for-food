package com.needforfood.service;

import com.needforfood.exception.custom.DuplicateEmailException;
import com.needforfood.exception.custom.InvalidPasswordException;
import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.model.entity.User;
import com.needforfood.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User register(String email, String username, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException(email);
        }

        User user = User.builder()
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .build();

        return userRepository.save(user);
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

    @Transactional
    public void deleteAccount(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Utilisateur introuvable: " + id);
        }
        userRepository.deleteById(id);
    }
}
