package com.needforfood.repository.nosql;

import com.needforfood.model.document.ShoppingListHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ShoppingListHistoryRepository extends MongoRepository<ShoppingListHistory, String> {

    List<ShoppingListHistory> findByUserId(Long userId);
}
