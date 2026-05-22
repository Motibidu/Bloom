package com.starterkit.domain.user.dto.response;

import com.starterkit.domain.user.entity.User;

import java.time.LocalDateTime;

public record UserResponse(Long id, String email, String nickname, String bio, LocalDateTime createdAt, boolean canWriteFeed, String profileImageUrl) {

    public static UserResponse from(User user) {
        return from(user, null);
    }

    public static UserResponse from(User user, String s3BaseUrl) {
        String profileImageUrl = null;
        if (s3BaseUrl != null && user.getProfileImageObjectKey() != null) {
            profileImageUrl = s3BaseUrl + "/" + user.getProfileImageObjectKey();
        }
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getBio(),
                user.getCreatedAt(),
                user.isAdult50s(),
                profileImageUrl);
    }
}
