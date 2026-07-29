package com.needforfood.repository.sql;

import com.needforfood.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query(
            value = "SELECT * FROM app_user u " +
                    "WHERE unaccent(lower(u.username)) LIKE unaccent(lower(concat('%', :username, '%'))) " +
                    "AND u.id <> :excludedId " +
                    "ORDER BY u.username " +
                    "LIMIT 20",
            nativeQuery = true
    )
    List<User> findTop20ByUsernameContainingIgnoreCaseAndIdNot(
            @Param("username") String username,
            @Param("excludedId") Long excludedId
    );
}
