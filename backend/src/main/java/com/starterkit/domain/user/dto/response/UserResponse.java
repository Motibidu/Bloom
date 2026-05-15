package com.starterkit.domain.user.dto.response;

import com.starterkit.domain.user.entity.User;

import java.time.LocalDateTime;

public record UserResponse(Long id, String email, String nickname, String bio, LocalDateTime createdAt, boolean canWriteFeed) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getBio(),
                user.getCreatedAt(),
                user.isAdult50s());
    }
}
