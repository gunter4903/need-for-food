package com.needforfood.service;

import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.ShoppingList;
import com.needforfood.model.entity.ShoppingListItem;
import com.needforfood.model.entity.User;
import com.needforfood.repository.sql.RecipeRepository;
import com.needforfood.repository.sql.ShoppingListRepository;
import com.needforfood.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final IngredientService ingredientService;

    @Transactional
    public ShoppingList createList(Long userId, String name) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));

        return shoppingListRepository.save(ShoppingList.builder().user(user).name(name).build());
    }

    @Transactional
    public ShoppingList generateFromRecipes(Long userId, String name, List<Long> recipeIds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));

        ShoppingList list = ShoppingList.builder().user(user).name(name).build();

        Map<Long, ShoppingListItem> mergedByIngredientId = new LinkedHashMap<>();
        for (Long recipeId : recipeIds) {
            Recipe recipe = recipeRepository.findById(recipeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Recette introuvable: " + recipeId));

            recipe.getIngredients().forEach(recipeIngredient -> mergedByIngredientId.merge(
                    recipeIngredient.getIngredient().getId(),
                    ShoppingListItem.builder()
                            .ingredient(recipeIngredient.getIngredient())
                            .quantity(recipeIngredient.getQuantity())
                            .checked(false)
                            .build(),
                    (existing, incoming) -> {
                        existing.setQuantity(existing.getQuantity() + incoming.getQuantity());
                        return existing;
                    }));
        }

        mergedByIngredientId.values().forEach(item -> {
            item.setShoppingList(list);
            list.getItems().add(item);
        });

        return shoppingListRepository.save(list);
    }

    @Transactional(readOnly = true)
    public ShoppingList getById(Long id, Long requesterId) {
        ShoppingList list = shoppingListRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Liste de courses introuvable: " + id));
        assertOwner(list, requesterId);
        return list;
    }

    @Transactional(readOnly = true)
    public List<ShoppingList> getByUser(Long userId) {
        return shoppingListRepository.findByUserId(userId);
    }

    @Transactional
    public ShoppingList addItem(Long listId, Long requesterId, String ingredientName, String unit, Float quantity) {
        ShoppingList list = getById(listId, requesterId);
        Ingredient ingredient = ingredientService.findOrCreate(ingredientName, unit);

        list.getItems().stream()
                .filter(item -> item.getIngredient().getId().equals(ingredient.getId()))
                .findFirst()
                .ifPresentOrElse(
                        existing -> existing.setQuantity(existing.getQuantity() + quantity),
                        () -> list.getItems().add(ShoppingListItem.builder()
                                .shoppingList(list)
                                .ingredient(ingredient)
                                .quantity(quantity)
                                .checked(false)
                                .build()));

        return list;
    }

    @Transactional
    public ShoppingList setItemChecked(Long listId, Long requesterId, Long ingredientId, boolean checked) {
        ShoppingList list = getById(listId, requesterId);
        findItem(list, ingredientId).setChecked(checked);
        return list;
    }

    @Transactional
    public ShoppingList removeItem(Long listId, Long requesterId, Long ingredientId) {
        ShoppingList list = getById(listId, requesterId);
        findItem(list, ingredientId);
        list.getItems().removeIf(item -> item.getIngredient().getId().equals(ingredientId));
        return list;
    }

    @Transactional
    public void deleteList(Long listId, Long requesterId) {
        ShoppingList list = getById(listId, requesterId);
        shoppingListRepository.delete(list);
    }

    private ShoppingListItem findItem(ShoppingList list, Long ingredientId) {
        return list.getItems().stream()
                .filter(item -> item.getIngredient().getId().equals(ingredientId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Ingrédient absent de la liste: " + ingredientId));
    }

    private void assertOwner(ShoppingList list, Long requesterId) {
        if (!list.getUser().getId().equals(requesterId)) {
            throw new AccessDeniedException("Vous ne pouvez accéder qu'à vos propres listes de courses");
        }
    }
}
