package com.starterkit.domain.user.dto.response;

import com.starterkit.domain.user.entity.User;

public record UserSearchResponse(
        Long id,
        String nickname,
        String bio,
        long followerCount,
        long followingCount,
        boolean isFollowing
) {
    public static UserSearchResponse of(User user, long followerCount, long followingCount, boolean isFollowing) {
        return new UserSearchResponse(
                user.getId(),
                user.getNickname(),
                user.getBio(),
                followerCount,
                followingCount,
                isFollowing
        );
    }
}
