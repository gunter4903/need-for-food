package com.needforfood.controller;

import com.needforfood.dto.request.ShoppingListCreateRequest;
import com.needforfood.dto.request.ShoppingListGenerateRequest;
import com.needforfood.dto.request.ShoppingListItemCheckRequest;
import com.needforfood.dto.request.ShoppingListItemRequest;
import com.needforfood.dto.response.ShoppingListHistoryResponse;
import com.needforfood.dto.response.ShoppingListResponse;
import com.needforfood.mapper.ShoppingListHistoryMapper;
import com.needforfood.mapper.ShoppingListMapper;
import com.needforfood.model.entity.ShoppingList;
import com.needforfood.service.ShoppingListService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shopping-lists")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService shoppingListService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShoppingListResponse create(@AuthenticationPrincipal Long userId,
                                        @Valid @RequestBody ShoppingListCreateRequest request) {
        return ShoppingListMapper.toResponse(shoppingListService.createList(userId, request.getName()));
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public ShoppingListResponse generate(@AuthenticationPrincipal Long userId,
                                          @Valid @RequestBody ShoppingListGenerateRequest request) {
        ShoppingList list = shoppingListService.generateFromRecipes(userId, request.getName(), request.getRecipeIds());
        return ShoppingListMapper.toResponse(list);
    }

    @GetMapping("/mine")
    public List<ShoppingListResponse> getMine(@AuthenticationPrincipal Long userId) {
        return shoppingListService.getByUser(userId).stream().map(ShoppingListMapper::toResponse).toList();
    }

    @GetMapping("/history/mine")
    public List<ShoppingListHistoryResponse> getHistory(@AuthenticationPrincipal Long userId) {
        return shoppingListService.getHistory(userId).stream().map(ShoppingListHistoryMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public ShoppingListResponse getById(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        return ShoppingListMapper.toResponse(shoppingListService.getById(id, userId));
    }

    @PostMapping("/{id}/items")
    public ShoppingListResponse addItem(@PathVariable Long id,
                                         @AuthenticationPrincipal Long userId,
                                         @Valid @RequestBody ShoppingListItemRequest request) {
        ShoppingList list = shoppingListService.addItem(
                id, userId, request.getIngredientName(), request.getUnit(), request.getQuantity());
        return ShoppingListMapper.toResponse(list);
    }

    @PatchMapping("/{id}/items/{ingredientId}")
    public ShoppingListResponse setItemChecked(@PathVariable Long id,
                                                @PathVariable Long ingredientId,
                                                @AuthenticationPrincipal Long userId,
                                                @RequestBody ShoppingListItemCheckRequest request) {
        ShoppingList list = shoppingListService.setItemChecked(id, userId, ingredientId, request.isChecked());
        return ShoppingListMapper.toResponse(list);
    }

    @DeleteMapping("/{id}/items/{ingredientId}")
    public ShoppingListResponse removeItem(@PathVariable Long id,
                                            @PathVariable Long ingredientId,
                                            @AuthenticationPrincipal Long userId) {
        ShoppingList list = shoppingListService.removeItem(id, userId, ingredientId);
        return ShoppingListMapper.toResponse(list);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        shoppingListService.deleteList(id, userId);
    }
}
