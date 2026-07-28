package com.needforfood.repository.sql;

import com.needforfood.model.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByUserId(Long userId);

    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.ingredient LEFT JOIN FETCH r.user WHERE r.id = :id")
    Optional<Recipe> findDetailedById(@Param("id") Long id);

    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.ingredient LEFT JOIN FETCH r.user WHERE r.user.id = :userId")
    List<Recipe> findDetailedByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.ingredient LEFT JOIN FETCH r.user")
    List<Recipe> findAllDetailed();
}
