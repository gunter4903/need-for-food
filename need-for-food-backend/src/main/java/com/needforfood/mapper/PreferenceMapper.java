package com.needforfood.mapper;

import com.needforfood.dto.response.UserPreferenceResponse;
import com.needforfood.model.document.UserPreference;

public final class PreferenceMapper {

    private PreferenceMapper() {
    }

    public static UserPreferenceResponse toResponse(UserPreference preference) {
        return new UserPreferenceResponse(
                preference.getUserId(),
                preference.getDiet(),
                preference.getAllergies(),
                preference.getDislikedIngredients(),
                preference.getFavoriteRecipeTypes(),
                preference.getMaxPreparationTime());
    }
}
