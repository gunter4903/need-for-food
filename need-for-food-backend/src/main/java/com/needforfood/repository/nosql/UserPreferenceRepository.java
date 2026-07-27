package com.needforfood.repository.nosql;

import com.needforfood.model.document.UserPreference;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserPreferenceRepository extends MongoRepository<UserPreference, String> {

    Optional<UserPreference> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
