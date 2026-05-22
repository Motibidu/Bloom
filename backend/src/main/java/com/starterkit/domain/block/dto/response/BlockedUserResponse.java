package com.starterkit.domain.block.dto.response;

public record BlockedUserResponse(
        Long userId,
        String nickname,
        String profileImageUrl
) {}
