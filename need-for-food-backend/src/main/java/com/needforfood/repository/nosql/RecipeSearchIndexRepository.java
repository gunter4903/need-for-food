package com.needforfood.repository.nosql;

import com.needforfood.model.document.RecipeSearchIndex;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RecipeSearchIndexRepository extends MongoRepository<RecipeSearchIndex, String> {

    Optional<RecipeSearchIndex> findByRecipeId(Long recipeId);

    List<RecipeSearchIndex> findByTypeIgnoreCase(String type);

    List<RecipeSearchIndex> findByDietIgnoreCase(String diet);
}
