package com.needforfood.repository.sql;

import com.needforfood.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findTop20ByUsernameContainingIgnoreCaseAndIdNot(String username, Long excludedId);
}
