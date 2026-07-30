package com.needforfood.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDataPayload {

    private LocalDateTime exportedAt;
    private ProfileData profile;
    private PreferencesData preferences;
    private List<RecipeData> recipes;
    private List<RecipeData> favorites;
    private List<ShoppingListData> shoppingLists;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProfileData {
        private String username;
        private String email;
        private String bio;
        private String avatarUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PreferencesData {
        private List<String> diet;
        private List<String> allergies;
        private List<String> dislikedIngredients;
        private List<String> favoriteRecipeTypes;
        private Integer maxPreparationTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecipeData {
        private String title;
        private String description;
        private String type;
        private String diet;
        private String difficulty;
        private Integer preparationTime;
        private List<IngredientData> ingredients;
        private List<String> steps;
        private List<String> imageUrls;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IngredientData {
        private String name;
        private String unit;
        private Float quantity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShoppingListData {
        private String name;
        private List<ShoppingListItemData> items;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShoppingListItemData {
        private String ingredientName;
        private String unit;
        private Float quantity;
        private boolean checked;
    }
}
