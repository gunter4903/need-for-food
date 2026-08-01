package com.needforfood.service;

import com.needforfood.exception.custom.InvalidImageFileException;
import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.exception.custom.TooManyRecipeImagesException;
import com.needforfood.model.document.RecipeSearchIndex;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeFavorite;
import com.needforfood.model.entity.RecipeImage;
import com.needforfood.model.entity.RecipeIngredient;
import com.needforfood.model.entity.User;
import com.needforfood.repository.nosql.RecipeSearchIndexRepository;
import com.needforfood.repository.sql.RecipeFavoriteRepository;
import com.needforfood.repository.sql.RecipeRepository;
import com.needforfood.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientService ingredientService;
    private final UserRepository userRepository;
    private final RecipeSearchIndexRepository recipeSearchIndexRepository;
    private final FriendshipService friendshipService;
    private final RecipeImageStorageService recipeImageStorageService;
    private final RecipeFavoriteRepository recipeFavoriteRepository;

    private static final int MAX_IMAGES_PER_RECIPE = 5;

    @Transactional
    public Recipe createRecipe(Long userId, Recipe recipe) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));

        recipe.setUser(user);
        linkIngredients(recipe, recipe.getIngredients());
        numberSteps(recipe, recipe.getSteps());
        linkImages(recipe, recipe.getImages());

        Recipe saved = recipeRepository.save(recipe);
        syncSearchIndex(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public Recipe getById(Long id) {
        Recipe recipe = recipeRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recette introuvable: " + id));
        initializeLazyCollections(recipe);
        return recipe;
    }

    @Transactional(readOnly = true)
    public Recipe getById(Long id, Long requesterId) {
        Recipe recipe = getById(id);
        if (!recipe.getUser().getId().equals(requesterId)
                && !friendshipService.areFriends(requesterId, recipe.getUser().getId())) {
            throw new AccessDeniedException("Vous ne pouvez consulter que vos recettes ou celles de vos amis");
        }
        return recipe;
    }

    @Transactional(readOnly = true)
    public List<Recipe> getByUser(Long userId) {
        List<Recipe> recipes = recipeRepository.findDetailedByUserId(userId);
        recipes.forEach(this::initializeLazyCollections);
        return recipes;
    }

    @Transactional(readOnly = true)
    public List<Recipe> getByUser(Long userId, Long requesterId) {
        if (!userId.equals(requesterId) && !friendshipService.areFriends(requesterId, userId)) {
            throw new AccessDeniedException("Vous ne pouvez consulter que vos recettes ou celles de vos amis");
        }
        return getByUser(userId);
    }

    @Transactional(readOnly = true)
    public List<Recipe> getAll(Long userId) {
        Set<Long> visibleUserIds = friendshipService.getFriendIds(userId);
        visibleUserIds.add(userId);

        List<Recipe> recipes = recipeRepository.findAllDetailed().stream()
                .filter(recipe -> visibleUserIds.contains(recipe.getUser().getId()))
                .toList();
        recipes.forEach(this::initializeLazyCollections);
        return deduplicate(recipes, userId);
    }

    private void initializeLazyCollections(Recipe recipe) {
        Hibernate.initialize(recipe.getSteps());
        Hibernate.initialize(recipe.getImages());
    }

    private List<Recipe> deduplicate(List<Recipe> recipes, Long userId) {
        Map<String, Recipe> bestByFingerprint = new LinkedHashMap<>();

        for (Recipe recipe : recipes) {
            String fingerprint = fingerprint(recipe);
            Recipe current = bestByFingerprint.get(fingerprint);

            if (current == null
                    || (!current.getUser().getId().equals(userId) && recipe.getUser().getId().equals(userId))
                    || (!current.getUser().getId().equals(userId) && recipe.getId() < current.getId())) {
                bestByFingerprint.put(fingerprint, recipe);
            }
        }

        return new ArrayList<>(bestByFingerprint.values());
    }

    private String fingerprint(Recipe recipe) {
        String ingredientsPart = recipe.getIngredients().stream()
                .map(ri -> normalize(ri.getIngredient().getName()) + ":" + ri.getQuantity()
                        + ":" + normalize(ri.getIngredient().getUnit()))
                .sorted()
                .collect(Collectors.joining("|"));

        String stepsPart = recipe.getSteps().stream()
                .sorted(Comparator.comparing(PreparationStep::getStepNumber))
                .map(step -> normalize(step.getDescription()))
                .collect(Collectors.joining("|"));

        return String.join("::",
                normalize(recipe.getTitle()),
                normalize(recipe.getDescription()),
                normalize(recipe.getType()),
                normalize(recipe.getDiet()),
                normalize(recipe.getDifficulty()),
                String.valueOf(recipe.getPreparationTime()),
                String.valueOf(recipe.getServings()),
                ingredientsPart,
                stepsPart);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    public record ImportResult(Recipe recipe, boolean created) {
    }

    @Transactional
    public ImportResult createRecipeIfNotDuplicate(Long userId, Recipe candidate) {
        String candidateFingerprint = fingerprint(candidate);
        Optional<Recipe> existing = getByUser(userId).stream()
                .filter(recipe -> fingerprint(recipe).equals(candidateFingerprint))
                .findFirst();

        if (existing.isPresent()) {
            return new ImportResult(existing.get(), false);
        }
        return new ImportResult(createRecipe(userId, candidate), true);
    }

    @Transactional(readOnly = true)
    public Optional<Long> findVisibleRecipeIdByFingerprint(Long userId, Recipe candidate) {
        String candidateFingerprint = fingerprint(candidate);
        return getAll(userId).stream()
                .filter(recipe -> fingerprint(recipe).equals(candidateFingerprint))
                .map(Recipe::getId)
                .findFirst();
    }

    @Transactional(readOnly = true)
    public List<RecipeMatch> searchByIngredientNames(Long userId, List<String> ingredientNames,
                                                       List<String> excludedIngredients, Integer maxPreparationTime) {
        Set<String> normalized = ingredientNames.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        return getAll(userId).stream()
                .filter(recipe -> respectsConstraints(recipe, excludedIngredients, maxPreparationTime))
                .map(recipe -> {
                    int total = recipe.getIngredients().size();
                    int matched = (int) recipe.getIngredients().stream()
                            .filter(ri -> normalized.contains(ri.getIngredient().getName().toLowerCase()))
                            .count();
                    return new RecipeMatch(recipe, matched, total);
                })
                .filter(match -> match.matchedCount() > 0)
                .sorted(Comparator.comparingInt(RecipeMatch::matchedCount).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Recipe> getSuggestions(Long userId, List<String> excludedIngredients, Integer maxPreparationTime,
                                        List<String> preferredDiets, List<String> preferredTypes) {
        List<Recipe> recipes = getAll(userId).stream()
                .filter(recipe -> respectsConstraints(recipe, excludedIngredients, maxPreparationTime))
                .collect(Collectors.toList());

        recipes.sort(Comparator.comparingInt(
                recipe -> matchesPreference(recipe, preferredDiets, preferredTypes) ? 0 : 1));

        return recipes;
    }

    private boolean respectsConstraints(Recipe recipe, List<String> excludedIngredients, Integer maxPreparationTime) {
        if (maxPreparationTime != null && recipe.getPreparationTime() != null
                && recipe.getPreparationTime() > maxPreparationTime) {
            return false;
        }
        if (excludedIngredients == null || excludedIngredients.isEmpty()) {
            return true;
        }
        Set<String> excluded = excludedIngredients.stream().map(String::toLowerCase).collect(Collectors.toSet());
        return recipe.getIngredients().stream()
                .noneMatch(ri -> excluded.contains(ri.getIngredient().getName().toLowerCase()));
    }

    private boolean matchesPreference(Recipe recipe, List<String> preferredDiets, List<String> preferredTypes) {
        boolean dietMatch = preferredDiets != null && recipe.getDiet() != null
                && preferredDiets.stream().anyMatch(diet -> diet.equalsIgnoreCase(recipe.getDiet()));
        boolean typeMatch = preferredTypes != null && recipe.getType() != null
                && preferredTypes.stream().anyMatch(type -> type.equalsIgnoreCase(recipe.getType()));
        return dietMatch || typeMatch;
    }

    @Transactional
    public Recipe updateRecipe(Long recipeId, Long requesterId, Recipe updates) {
        Recipe recipe = getById(recipeId);
        assertOwner(recipe, requesterId);

        recipe.setTitle(updates.getTitle());
        recipe.setDescription(updates.getDescription());
        recipe.setType(updates.getType());
        recipe.setDiet(updates.getDiet());
        recipe.setDifficulty(updates.getDifficulty());
        recipe.setPreparationTime(updates.getPreparationTime());
        recipe.setServings(updates.getServings());

        recipe.getIngredients().clear();
        recipe.getSteps().clear();
        recipeRepository.flush();

        linkIngredients(recipe, updates.getIngredients());
        recipe.getIngredients().addAll(updates.getIngredients());

        numberSteps(recipe, updates.getSteps());
        recipe.getSteps().addAll(updates.getSteps());

        syncSearchIndex(recipe);
        return recipe;
    }

    @Transactional
    public void deleteRecipe(Long recipeId, Long requesterId) {
        Recipe recipe = getById(recipeId);
        assertOwner(recipe, requesterId);
        recipe.getImages().forEach(image -> recipeImageStorageService.delete(image.getUrl()));
        recipeRepository.delete(recipe);
        recipeSearchIndexRepository.deleteByRecipeId(recipeId);
    }

    @Transactional
    public Recipe addImages(Long recipeId, Long requesterId, List<MultipartFile> files) {
        Recipe recipe = getById(recipeId);
        assertOwner(recipe, requesterId);

        if (files == null || files.isEmpty()) {
            throw new InvalidImageFileException("Aucun fichier envoyé");
        }
        if (recipe.getImages().size() + files.size() > MAX_IMAGES_PER_RECIPE) {
            throw new TooManyRecipeImagesException(
                    MAX_IMAGES_PER_RECIPE + " images maximum par recette");
        }

        int nextPosition = recipe.getImages().size();
        for (MultipartFile file : files) {
            String url = recipeImageStorageService.store(file);
            recipe.getImages().add(RecipeImage.builder()
                    .recipe(recipe)
                    .url(url)
                    .position(nextPosition++)
                    .build());
        }

        return recipeRepository.save(recipe);
    }

    @Transactional
    public void removeImage(Long recipeId, Long requesterId, Long imageId) {
        Recipe recipe = getById(recipeId);
        assertOwner(recipe, requesterId);

        RecipeImage toRemove = recipe.getImages().stream()
                .filter(image -> image.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Image introuvable: " + imageId));

        recipe.getImages().remove(toRemove);
        recipeImageStorageService.delete(toRemove.getUrl());
    }

    /**
     * Réutilise getById(id, requesterId) pour la vérification de visibilité : impossible de
     * mettre en favori une recette qu'on n'a pas le droit de voir (ni propriétaire, ni ami du
     * propriétaire). Idempotent : ajouter un favori déjà présent ne fait rien (pas d'erreur).
     */
    @Transactional
    public void addFavorite(Long userId, Long recipeId) {
        Recipe recipe = getById(recipeId, userId);

        if (recipeFavoriteRepository.existsByUserIdAndRecipeId(userId, recipeId)) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));

        recipeFavoriteRepository.save(RecipeFavorite.builder().user(user).recipe(recipe).build());
    }

    @Transactional
    public void removeFavorite(Long userId, Long recipeId) {
        recipeFavoriteRepository.deleteByUserIdAndRecipeId(userId, recipeId);
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long recipeId) {
        return recipeFavoriteRepository.existsByUserIdAndRecipeId(userId, recipeId);
    }

    @Transactional(readOnly = true)
    public Set<Long> getFavoriteRecipeIds(Long userId) {
        return recipeFavoriteRepository.findRecipeIdsByUserId(userId);
    }

    private void syncSearchIndex(Recipe recipe) {
        List<String> ingredientNames = recipe.getIngredients().stream()
                .map(ri -> ri.getIngredient().getName())
                .toList();

        RecipeSearchIndex index = recipeSearchIndexRepository.findByRecipeId(recipe.getId())
                .orElseGet(() -> RecipeSearchIndex.builder()
                        .recipeId(recipe.getId())
                        .popularityScore(0)
                        .createdAt(LocalDateTime.now())
                        .build());

        index.setTitle(recipe.getTitle());
        index.setType(recipe.getType());
        index.setDiet(recipe.getDiet());
        index.setPreparationTime(recipe.getPreparationTime());
        index.setIngredients(ingredientNames);
        index.setUpdatedAt(LocalDateTime.now());

        recipeSearchIndexRepository.save(index);
    }

    private void linkIngredients(Recipe recipe, List<RecipeIngredient> ingredients) {
        for (RecipeIngredient recipeIngredient : ingredients) {
            Ingredient resolved = resolveIngredient(recipeIngredient.getIngredient());
            recipeIngredient.setIngredient(resolved);
            recipeIngredient.setRecipe(recipe);
        }
    }

    private void numberSteps(Recipe recipe, List<PreparationStep> steps) {
        for (int i = 0; i < steps.size(); i++) {
            steps.get(i).setRecipe(recipe);
            steps.get(i).setStepNumber(i + 1);
        }
    }

    private void linkImages(Recipe recipe, List<RecipeImage> images) {
        for (int i = 0; i < images.size(); i++) {
            images.get(i).setRecipe(recipe);
            images.get(i).setPosition(i);
        }
    }

    private Ingredient resolveIngredient(Ingredient candidate) {
        return ingredientService.findOrCreate(candidate.getName(), candidate.getUnit());
    }

    private void assertOwner(Recipe recipe, Long requesterId) {
        if (!recipe.getUser().getId().equals(requesterId)) {
            throw new AccessDeniedException("Vous ne pouvez modifier que vos propres recettes");
        }
    }
}
