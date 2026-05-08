package com.starterkit.domain.checkin.dto.response;

import com.starterkit.domain.checkin.entity.Category;
import com.starterkit.domain.checkin.entity.Checkin;

import java.time.LocalDateTime;

public record CheckinResponse(
        Long id,
        Long userId,
        String nickname,
        Category category,
        String title,
        String description,
        String photoUrl,
        long likeCount,
        boolean likedByMe,
        long commentCount,
        long viewCount,
        LocalDateTime createdAt) {

    public static CheckinResponse of(Checkin c, long likeCount, boolean likedByMe, long commentCount, String s3BaseUrl) {
        String photoUrl = c.getPhotoObjectKey() != null ? s3BaseUrl + "/" + c.getPhotoObjectKey() : null;
        return new CheckinResponse(
                c.getId(), c.getUser().getId(), c.getUser().getNickname(),
                c.getCategory(), c.getTitle(), c.getDescription(), photoUrl,
                likeCount, likedByMe, commentCount, c.getViewCount(), c.getCreatedAt());
    }
}
