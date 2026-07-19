package com.needforfood.repository.sql;

import com.needforfood.model.entity.ShoppingList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShoppingListRepository extends JpaRepository<ShoppingList, Long> {

    List<ShoppingList> findByUserId(Long userId);

    // Charge les items (et leur Ingredient) en une requête pour éviter le
    // LazyInitializationException lors du mappage vers ShoppingListResponse dans le contrôleur.
    @Query("SELECT DISTINCT s FROM ShoppingList s LEFT JOIN FETCH s.items i LEFT JOIN FETCH i.ingredient WHERE s.id = :id")
    Optional<ShoppingList> findDetailedById(@Param("id") Long id);

    @Query("SELECT DISTINCT s FROM ShoppingList s LEFT JOIN FETCH s.items i LEFT JOIN FETCH i.ingredient WHERE s.user.id = :userId")
    List<ShoppingList> findDetailedByUserId(@Param("userId") Long userId);
}
