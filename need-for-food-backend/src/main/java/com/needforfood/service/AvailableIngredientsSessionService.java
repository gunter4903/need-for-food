package com.needforfood.service;

import com.needforfood.model.document.AvailableIngredientsSession;
import com.needforfood.model.document.IngredientQuantity;
import com.needforfood.repository.nosql.AvailableIngredientsSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AvailableIngredientsSessionService {

    private final AvailableIngredientsSessionRepository sessionRepository;
    private final RecipeService recipeService;

    public AvailableIngredientsSession save(Long userId, List<IngredientQuantity> ingredients) {
        List<String> names = ingredients.stream().map(IngredientQuantity::getName).toList();

        List<Long> suggestedRecipeIds = recipeService.searchByIngredientNames(userId, names, List.of(), null).stream()
                .map(match -> match.recipe().getId())
                .toList();

        AvailableIngredientsSession session = AvailableIngredientsSession.builder()
                .userId(userId)
                .ingredients(ingredients)
                .suggestedRecipes(suggestedRecipeIds)
                .createdAt(LocalDateTime.now())
                .build();

        return sessionRepository.save(session);
    }

    public List<AvailableIngredientsSession> getHistory(Long userId) {
        return sessionRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(AvailableIngredientsSession::getCreatedAt).reversed())
                .toList();
    }
}
