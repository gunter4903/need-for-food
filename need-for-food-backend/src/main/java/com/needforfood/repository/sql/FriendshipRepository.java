package com.needforfood.repository.sql;

import com.needforfood.model.entity.Friendship;
import com.needforfood.model.entity.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByRequesterIdAndAddresseeId(Long requesterId, Long addresseeId);

    List<Friendship> findByAddresseeIdAndStatus(Long addresseeId, FriendshipStatus status);

    List<Friendship> findByRequesterIdAndStatus(Long requesterId, FriendshipStatus status);

    @Query("select f from Friendship f where f.status = com.needforfood.model.entity.FriendshipStatus.ACCEPTED "
            + "and (f.requester.id = :userId or f.addressee.id = :userId)")
    List<Friendship> findAcceptedByUser(@Param("userId") Long userId);

    @Query("select case when count(f) > 0 then true else false end from Friendship f "
            + "where f.status = com.needforfood.model.entity.FriendshipStatus.ACCEPTED "
            + "and ((f.requester.id = :userIdA and f.addressee.id = :userIdB) "
            + "or (f.requester.id = :userIdB and f.addressee.id = :userIdA))")
    boolean areFriends(@Param("userIdA") Long userIdA, @Param("userIdB") Long userIdB);

    @Query("select f from Friendship f where f.status = com.needforfood.model.entity.FriendshipStatus.ACCEPTED "
            + "and ((f.requester.id = :userIdA and f.addressee.id = :userIdB) "
            + "or (f.requester.id = :userIdB and f.addressee.id = :userIdA))")
    Optional<Friendship> findAcceptedBetween(@Param("userIdA") Long userIdA, @Param("userIdB") Long userIdB);
}
