package com.starterkit.domain.board.dto.response;

import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;

import java.time.LocalDateTime;

public record PostSummaryResponse(
        Long id,
        PostCategory category,
        String title,
        String contentPreview,
        String thumbnailUrl,
        Long userId,
        String nickname,
        LocalDateTime createdAt,
        long commentCount,
        long likeCount,
        long viewCount) {

    public static PostSummaryResponse of(Post p, long commentCount, long likeCount, String s3BaseUrl) {
        String preview = p.getContent().length() > 60
                ? p.getContent().substring(0, 60)
                : p.getContent();
        String thumbnail = p.getPhotos().isEmpty()
                ? null
                : s3BaseUrl + "/" + p.getPhotos().get(0).getObjectKey();
        return new PostSummaryResponse(
                p.getId(), p.getCategory(), p.getTitle(), preview, thumbnail,
                p.getUser().getId(), p.getUser().getNickname(), p.getCreatedAt(),
                commentCount, likeCount, p.getViewCount());
    }
}
