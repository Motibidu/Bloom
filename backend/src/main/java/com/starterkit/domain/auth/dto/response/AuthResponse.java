package com.starterkit.domain.auth.dto.response;

public record AuthResponse(String accessToken, String refreshToken, String tokenType, Boolean needsNicknameSetup) {

    public static AuthResponse withoutRefreshToken(AuthResponse src) {
        return new AuthResponse(src.accessToken(), null, src.tokenType(), src.needsNicknameSetup());
    }
}
