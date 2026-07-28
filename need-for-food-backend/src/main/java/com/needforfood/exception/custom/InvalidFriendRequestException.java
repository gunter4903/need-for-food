package com.needforfood.exception.custom;

public class InvalidFriendRequestException extends RuntimeException {

    public InvalidFriendRequestException(String message) {
        super(message);
    }
}
