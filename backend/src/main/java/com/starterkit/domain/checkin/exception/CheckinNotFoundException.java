package com.starterkit.domain.checkin.exception;

public class CheckinNotFoundException extends RuntimeException {
    public CheckinNotFoundException(String message) {
        super(message);
    }
}
