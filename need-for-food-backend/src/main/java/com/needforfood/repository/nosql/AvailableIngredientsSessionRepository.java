package com.needforfood.repository.nosql;

import com.needforfood.model.document.AvailableIngredientsSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AvailableIngredientsSessionRepository extends MongoRepository<AvailableIngredientsSession, String> {

    List<AvailableIngredientsSession> findByUserId(Long userId);
}
