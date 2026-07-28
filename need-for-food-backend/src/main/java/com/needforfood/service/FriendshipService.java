package com.needforfood.service;

import com.needforfood.exception.custom.InvalidFriendRequestException;
import com.needforfood.exception.custom.ResourceNotFoundException;
import com.needforfood.model.entity.Friendship;
import com.needforfood.model.entity.FriendshipStatus;
import com.needforfood.model.entity.User;
import com.needforfood.repository.sql.FriendshipRepository;
import com.needforfood.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    @Transactional
    public Friendship sendRequest(Long requesterId, Long addresseeId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + requesterId));
        User addressee = userRepository.findById(addresseeId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + addresseeId));

        if (addressee.getId().equals(requesterId)) {
            throw new InvalidFriendRequestException("Vous ne pouvez pas vous ajouter vous-même");
        }

        Friendship reverse = friendshipRepository.findByRequesterIdAndAddresseeId(addressee.getId(), requesterId)
                .orElse(null);
        if (reverse != null && reverse.getStatus() == FriendshipStatus.PENDING) {
            reverse.setStatus(FriendshipStatus.ACCEPTED);
            reverse.setRespondedAt(LocalDateTime.now());
            return reverse;
        }

        Friendship existing = friendshipRepository.findByRequesterIdAndAddresseeId(requesterId, addressee.getId())
                .orElse(null);
        if (existing != null) {
            if (existing.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new InvalidFriendRequestException("Vous êtes déjà amis avec cette personne");
            }
            throw new InvalidFriendRequestException("Une demande est déjà en attente pour cette personne");
        }

        Friendship friendship = Friendship.builder()
                .requester(requester)
                .addressee(addressee)
                .status(FriendshipStatus.PENDING)
                .build();

        return friendshipRepository.save(friendship);
    }

    @Transactional
    public Friendship accept(Long friendshipId, Long userId) {
        Friendship friendship = getPending(friendshipId);

        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new AccessDeniedException("Seul le destinataire peut accepter cette demande");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendship.setRespondedAt(LocalDateTime.now());
        return friendship;
    }

    @Transactional
    public void cancelOrReject(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable: " + friendshipId));

        boolean isParty = friendship.getRequester().getId().equals(userId)
                || friendship.getAddressee().getId().equals(userId);
        if (!isParty) {
            throw new AccessDeniedException("Vous n'êtes pas concerné par cette demande");
        }

        friendshipRepository.delete(friendship);
    }

    @Transactional
    public void unfriend(Long userId, Long friendUserId) {
        Friendship friendship = friendshipRepository.findAcceptedBetween(userId, friendUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vous n'êtes pas ami avec cet utilisateur"));
        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<User> getFriends(Long userId) {
        return friendshipRepository.findAcceptedByUser(userId).stream()
                .map(friendship -> otherParty(friendship, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public Set<Long> getFriendIds(Long userId) {
        Set<Long> ids = new HashSet<>();
        friendshipRepository.findAcceptedByUser(userId)
                .forEach(friendship -> ids.add(otherParty(friendship, userId).getId()));
        return ids;
    }

    @Transactional(readOnly = true)
    public List<Friendship> getReceivedRequests(Long userId) {
        return friendshipRepository.findByAddresseeIdAndStatus(userId, FriendshipStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<Friendship> getSentRequests(Long userId) {
        return friendshipRepository.findByRequesterIdAndStatus(userId, FriendshipStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public boolean areFriends(Long userIdA, Long userIdB) {
        return friendshipRepository.areFriends(userIdA, userIdB);
    }

    @Transactional(readOnly = true)
    public String getStatusBetween(Long viewerId, Long otherId) {
        if (friendshipRepository.areFriends(viewerId, otherId)) {
            return "FRIENDS";
        }
        return friendshipRepository.findByRequesterIdAndAddresseeId(viewerId, otherId)
                .filter(f -> f.getStatus() == FriendshipStatus.PENDING)
                .map(f -> "PENDING_SENT")
                .or(() -> friendshipRepository.findByRequesterIdAndAddresseeId(otherId, viewerId)
                        .filter(f -> f.getStatus() == FriendshipStatus.PENDING)
                        .map(f -> "PENDING_RECEIVED"))
                .orElse("NONE");
    }

    private Friendship getPending(Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable: " + friendshipId));
        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new InvalidFriendRequestException("Cette demande a déjà été traitée");
        }
        return friendship;
    }

    private User otherParty(Friendship friendship, Long userId) {
        return friendship.getRequester().getId().equals(userId) ? friendship.getAddressee() : friendship.getRequester();
    }
}
