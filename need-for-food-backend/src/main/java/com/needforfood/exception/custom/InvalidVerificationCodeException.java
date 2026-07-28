package com.needforfood.exception.custom;

public class InvalidVerificationCodeException extends RuntimeException {

    public InvalidVerificationCodeException() {
        super("Code de vérification invalide ou expiré");
    }
}
