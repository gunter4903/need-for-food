package com.needforfood.service;

import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.repository.sql.IngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;

    @Transactional(readOnly = true)
    public List<Ingredient> getAll() {
        return ingredientRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Ingredient getById(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ingrédient introuvable: " + id));
    }

    @Transactional
    public Ingredient findOrCreate(String name, String unit) {
        return ingredientRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> ingredientRepository.save(Ingredient.builder().name(name).unit(unit).build()));
    }
}
