package com.starterkit.domain.family.exception;

public class FamilyNotFoundException extends RuntimeException {
    public FamilyNotFoundException(String message) {
        super(message);
    }
}
