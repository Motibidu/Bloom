package com.starterkit.domain.checkin.dto.response;

import com.starterkit.domain.checkin.entity.Category;
import com.starterkit.domain.checkin.entity.Checkin;

import java.time.LocalDateTime;
import java.util.List;

public record CheckinResponse(
        Long id,
        Long userId,
        String nickname,
        Category category,
        String title,
        String description,
        List<String> photoUrls,
        long likeCount,
        boolean likedByMe,
        long commentCount,
        long viewCount,
        LocalDateTime createdAt) {

    public static CheckinResponse of(Checkin c, long likeCount, boolean likedByMe, long commentCount, String s3BaseUrl) {
        List<String> urls = c.getPhotos().stream()
                .map(p -> s3BaseUrl + "/" + p.getObjectKey())
                .toList();
        if (urls.isEmpty() && c.getPhotoObjectKey() != null) {
            urls = List.of(s3BaseUrl + "/" + c.getPhotoObjectKey());
        }
        return new CheckinResponse(
                c.getId(), c.getUser().getId(), c.getUser().getNickname(),
                c.getCategory(), c.getTitle(), c.getDescription(), urls,
                likeCount, likedByMe, commentCount, c.getViewCount(), c.getCreatedAt());
    }
}
