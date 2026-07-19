package com.needforfood.repository.sql;

import com.needforfood.model.entity.ShoppingList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShoppingListRepository extends JpaRepository<ShoppingList, Long> {

    List<ShoppingList> findByUserId(Long userId);
}
