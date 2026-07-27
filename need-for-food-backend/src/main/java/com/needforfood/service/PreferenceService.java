package com.needforfood.service;

import com.needforfood.model.document.UserPreference;
import com.needforfood.repository.nosql.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PreferenceService {

    private final UserPreferenceRepository preferenceRepository;

    public UserPreference getByUserId(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .orElseGet(() -> emptyPreference(userId));
    }

    public UserPreference update(Long userId, List<String> diet, List<String> allergies,
                                  List<String> dislikedIngredients, List<String> favoriteRecipeTypes,
                                  Integer maxPreparationTime) {
        UserPreference preference = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> UserPreference.builder()
                        .userId(userId)
                        .createdAt(LocalDateTime.now())
                        .build());

        preference.setDiet(diet);
        preference.setAllergies(allergies);
        preference.setDislikedIngredients(dislikedIngredients);
        preference.setFavoriteRecipeTypes(favoriteRecipeTypes);
        preference.setMaxPreparationTime(maxPreparationTime);
        preference.setUpdatedAt(LocalDateTime.now());

        return preferenceRepository.save(preference);
    }

    private UserPreference emptyPreference(Long userId) {
        return UserPreference.builder()
                .userId(userId)
                .diet(List.of())
                .allergies(List.of())
                .dislikedIngredients(List.of())
                .favoriteRecipeTypes(List.of())
                .build();
    }
}
