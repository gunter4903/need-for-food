package com.needforfood.repository.sql;

import com.needforfood.model.entity.RecipeFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface RecipeFavoriteRepository extends JpaRepository<RecipeFavorite, Long> {

    boolean existsByUserIdAndRecipeId(Long userId, Long recipeId);

    void deleteByUserIdAndRecipeId(Long userId, Long recipeId);

    @Query("SELECT f.recipe.id FROM RecipeFavorite f WHERE f.user.id = :userId")
    Set<Long> findRecipeIdsByUserId(@Param("userId") Long userId);
}
