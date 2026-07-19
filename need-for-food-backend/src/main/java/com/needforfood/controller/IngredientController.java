package com.needforfood.controller;

import com.needforfood.dto.response.IngredientResponse;
import com.needforfood.mapper.IngredientMapper;
import com.needforfood.service.IngredientService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
public class IngredientController {

    private final IngredientService ingredientService;

    @GetMapping
    public List<IngredientResponse> getAll() {
        return ingredientService.getAll().stream().map(IngredientMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public IngredientResponse getById(@PathVariable Long id) {
        return IngredientMapper.toResponse(ingredientService.getById(id));
    }
}
