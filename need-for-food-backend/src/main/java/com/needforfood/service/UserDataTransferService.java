package com.needforfood.service;

import com.needforfood.dto.UserDataPayload;
import com.needforfood.dto.response.ImportSummaryResponse;
import com.needforfood.model.document.UserPreference;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeIngredient;
import com.needforfood.model.entity.ShoppingList;
import com.needforfood.model.entity.ShoppingListItem;
import com.needforfood.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDataTransferService {

    private final UserService userService;
    private final PreferenceService preferenceService;
    private final RecipeService recipeService;
    private final ShoppingListService shoppingListService;

    @Transactional(readOnly = true)
    public UserDataPayload exportData(Long userId) {
        User user = userService.getById(userId);

        UserDataPayload.ProfileData profile = UserDataPayload.ProfileData.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .build();

        UserPreference preference = preferenceService.getByUserId(userId);
        UserDataPayload.PreferencesData preferences = UserDataPayload.PreferencesData.builder()
                .diet(preference.getDiet())
                .allergies(preference.getAllergies())
                .dislikedIngredients(preference.getDislikedIngredients())
                .favoriteRecipeTypes(preference.getFavoriteRecipeTypes())
                .maxPreparationTime(preference.getMaxPreparationTime())
                .build();

        List<UserDataPayload.RecipeData> recipes = recipeService.getByUser(userId).stream()
                .map(this::toRecipeData)
                .toList();

        List<UserDataPayload.RecipeData> favorites = recipeService.getFavoriteRecipeIds(userId).stream()
                .map(recipeId -> recipeService.getById(recipeId, userId))
                .map(this::toRecipeData)
                .toList();

        List<UserDataPayload.ShoppingListData> shoppingLists = shoppingListService.getByUser(userId).stream()
                .map(this::toShoppingListData)
                .toList();

        return UserDataPayload.builder()
                .exportedAt(LocalDateTime.now())
                .profile(profile)
                .preferences(preferences)
                .recipes(recipes)
                .favorites(favorites)
                .shoppingLists(shoppingLists)
                .build();
    }

    @Transactional
    public ImportSummaryResponse importData(Long userId, UserDataPayload payload) {
        boolean profileUpdated = importProfile(userId, payload.getProfile());
        boolean preferencesImported = importPreferences(userId, payload.getPreferences());

        int recipesImported = 0;
        int recipesSkipped = 0;
        for (UserDataPayload.RecipeData recipeData : orEmpty(payload.getRecipes())) {
            RecipeService.ImportResult result = recipeService.createRecipeIfNotDuplicate(userId, toEntity(recipeData));
            if (result.created()) {
                recipesImported++;
            } else {
                recipesSkipped++;
            }
        }

        int favoritesImported = 0;
        int favoritesSkipped = 0;
        for (UserDataPayload.RecipeData favoriteData : orEmpty(payload.getFavorites())) {
            Optional<Long> matchedRecipeId = recipeService.findVisibleRecipeIdByFingerprint(userId, toEntity(favoriteData));
            if (matchedRecipeId.isPresent()) {
                recipeService.addFavorite(userId, matchedRecipeId.get());
                favoritesImported++;
            } else {
                favoritesSkipped++;
            }
        }

        int shoppingListsImported = 0;
        int shoppingListsSkipped = 0;
        Set<String> existingListFingerprints = shoppingListService.getByUser(userId).stream()
                .map(this::fingerprint)
                .collect(Collectors.toCollection(HashSet::new));
        for (UserDataPayload.ShoppingListData listData : orEmpty(payload.getShoppingLists())) {
            String candidateFingerprint = fingerprint(listData);
            if (existingListFingerprints.contains(candidateFingerprint)) {
                shoppingListsSkipped++;
                continue;
            }
            importShoppingList(userId, listData);
            existingListFingerprints.add(candidateFingerprint);
            shoppingListsImported++;
        }

        return new ImportSummaryResponse(
                profileUpdated, preferencesImported,
                recipesImported, recipesSkipped,
                favoritesImported, favoritesSkipped,
                shoppingListsImported, shoppingListsSkipped);
    }

    private boolean importProfile(Long userId, UserDataPayload.ProfileData profile) {
        if (profile == null || (profile.getBio() == null && profile.getAvatarUrl() == null)) {
            return false;
        }
        User user = userService.getById(userId);
        String bio = profile.getBio() != null ? profile.getBio() : user.getBio();
        String avatarUrl = profile.getAvatarUrl() != null ? profile.getAvatarUrl() : user.getAvatarUrl();
        userService.updateProfile(userId, user.getUsername(), user.getEmail(), bio, avatarUrl);
        return true;
    }

    private boolean importPreferences(Long userId, UserDataPayload.PreferencesData preferences) {
        if (preferences == null) {
            return false;
        }
        preferenceService.update(userId, preferences.getDiet(), preferences.getAllergies(),
                preferences.getDislikedIngredients(), preferences.getFavoriteRecipeTypes(),
                preferences.getMaxPreparationTime());
        return true;
    }

    private void importShoppingList(Long userId, UserDataPayload.ShoppingListData listData) {
        ShoppingList list = shoppingListService.createList(userId, listData.getName());

        for (UserDataPayload.ShoppingListItemData item : orEmpty(listData.getItems())) {
            list = shoppingListService.addItem(
                    list.getId(), userId, item.getIngredientName(), item.getUnit(), item.getQuantity());
        }

        Long listId = list.getId();
        List<ShoppingListItem> savedItems = list.getItems();
        for (UserDataPayload.ShoppingListItemData item : orEmpty(listData.getItems())) {
            if (!item.isChecked()) {
                continue;
            }
            savedItems.stream()
                    .filter(shoppingListItem -> shoppingListItem.getIngredient().getName()
                            .equalsIgnoreCase(item.getIngredientName()))
                    .findFirst()
                    .ifPresent(shoppingListItem -> shoppingListService.setItemChecked(
                            listId, userId, shoppingListItem.getIngredient().getId(), true));
        }
    }

    private UserDataPayload.RecipeData toRecipeData(Recipe recipe) {
        List<UserDataPayload.IngredientData> ingredients = recipe.getIngredients().stream()
                .map(ri -> UserDataPayload.IngredientData.builder()
                        .name(ri.getIngredient().getName())
                        .unit(ri.getIngredient().getUnit())
                        .quantity(ri.getQuantity())
                        .build())
                .toList();

        List<String> steps = recipe.getSteps().stream()
                .sorted((a, b) -> a.getStepNumber().compareTo(b.getStepNumber()))
                .map(PreparationStep::getDescription)
                .toList();

        List<String> imageUrls = recipe.getImages().stream()
                .map(image -> image.getUrl())
                .toList();

        return UserDataPayload.RecipeData.builder()
                .title(recipe.getTitle())
                .description(recipe.getDescription())
                .type(recipe.getType())
                .diet(recipe.getDiet())
                .difficulty(recipe.getDifficulty())
                .preparationTime(recipe.getPreparationTime())
                .ingredients(ingredients)
                .steps(steps)
                .imageUrls(imageUrls)
                .build();
    }

    private UserDataPayload.ShoppingListData toShoppingListData(ShoppingList list) {
        List<UserDataPayload.ShoppingListItemData> items = list.getItems().stream()
                .map(item -> UserDataPayload.ShoppingListItemData.builder()
                        .ingredientName(item.getIngredient().getName())
                        .unit(item.getIngredient().getUnit())
                        .quantity(item.getQuantity())
                        .checked(item.isChecked())
                        .build())
                .toList();

        return UserDataPayload.ShoppingListData.builder()
                .name(list.getName())
                .items(items)
                .build();
    }

    private Recipe toEntity(UserDataPayload.RecipeData data) {
        List<RecipeIngredient> ingredients = new ArrayList<>();
        for (UserDataPayload.IngredientData ingredientData : orEmpty(data.getIngredients())) {
            ingredients.add(RecipeIngredient.builder()
                    .ingredient(Ingredient.builder()
                            .name(ingredientData.getName())
                            .unit(ingredientData.getUnit())
                            .build())
                    .quantity(ingredientData.getQuantity())
                    .build());
        }

        List<PreparationStep> steps = new ArrayList<>();
        List<String> rawSteps = orEmpty(data.getSteps());
        for (int i = 0; i < rawSteps.size(); i++) {
            steps.add(PreparationStep.builder()
                    .description(rawSteps.get(i))
                    .stepNumber(i + 1)
                    .build());
        }

        return Recipe.builder()
                .title(data.getTitle())
                .description(data.getDescription())
                .type(data.getType())
                .diet(data.getDiet())
                .difficulty(data.getDifficulty())
                .preparationTime(data.getPreparationTime())
                .ingredients(ingredients)
                .steps(steps)
                .build();
    }

    private String fingerprint(ShoppingList list) {
        String itemsPart = list.getItems().stream()
                .map(item -> normalize(item.getIngredient().getName()) + ":" + item.getQuantity()
                        + ":" + normalize(item.getIngredient().getUnit()))
                .sorted()
                .collect(Collectors.joining("|"));
        return normalize(list.getName()) + "::" + itemsPart;
    }

    private String fingerprint(UserDataPayload.ShoppingListData data) {
        String itemsPart = orEmpty(data.getItems()).stream()
                .map(item -> normalize(item.getIngredientName()) + ":" + item.getQuantity()
                        + ":" + normalize(item.getUnit()))
                .sorted()
                .collect(Collectors.joining("|"));
        return normalize(data.getName()) + "::" + itemsPart;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static <T> List<T> orEmpty(List<T> list) {
        return list == null ? List.of() : list;
    }
}
