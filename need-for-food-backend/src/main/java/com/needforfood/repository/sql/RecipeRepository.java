package com.needforfood.repository.sql;

import com.needforfood.model.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByUserId(Long userId);

    // Charge en une requête les ingrédients (et leur Ingredient associé) pour éviter le
    // LazyInitializationException lors du mappage vers RecipeResponse dans le contrôleur
    // (la session Hibernate est fermée à ce moment-là, spring.jpa.open-in-view=false).
    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.ingredient WHERE r.id = :id")
    Optional<Recipe> findDetailedById(@Param("id") Long id);

    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.ingredient WHERE r.user.id = :userId")
    List<Recipe> findDetailedByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.ingredient")
    List<Recipe> findAllDetailed();
}
