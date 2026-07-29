package com.needforfood.exception.custom;

public class TooManyRecipeImagesException extends RuntimeException {

    public TooManyRecipeImagesException(String message) {
        super(message);
    }
}
