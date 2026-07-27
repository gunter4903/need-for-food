package com.needforfood.controller;

import com.needforfood.dto.request.UserPreferenceRequest;
import com.needforfood.dto.response.UserPreferenceResponse;
import com.needforfood.mapper.PreferenceMapper;
import com.needforfood.service.PreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/preferences")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService preferenceService;

    @GetMapping("/me")
    public UserPreferenceResponse me(@AuthenticationPrincipal Long userId) {
        return PreferenceMapper.toResponse(preferenceService.getByUserId(userId));
    }

    @PutMapping("/me")
    public UserPreferenceResponse updateMe(@AuthenticationPrincipal Long userId,
                                            @RequestBody UserPreferenceRequest request) {
        return PreferenceMapper.toResponse(preferenceService.update(
                userId,
                request.getDiet(),
                request.getAllergies(),
                request.getDislikedIngredients(),
                request.getFavoriteRecipeTypes(),
                request.getMaxPreparationTime()));
    }
}
