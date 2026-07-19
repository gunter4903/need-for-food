package com.needforfood.exception.custom;

public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String email) {
        super("Un compte existe déjà avec l'adresse " + email);
    }
}
