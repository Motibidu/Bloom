package com.starterkit.domain.board.dto.response;

import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;
import com.starterkit.domain.like.entity.ReactionType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record PostResponse(
        Long id,
        Long userId,
        String nickname,
        String profileImageUrl,
        PostCategory category,
        String title,
        String content,
        List<String> photoUrls,
        long likeCount,
        ReactionType myReactionType,
        Map<String, Long> reactionCounts,
        long commentCount,
        long viewCount,
        LocalDateTime createdAt) {

    public static PostResponse of(Post p, long likeCount, ReactionType myReactionType,
                                   Map<String, Long> reactionCounts, long commentCount, String s3BaseUrl) {
        List<String> urls = p.getPhotos().stream()
                .map(photo -> s3BaseUrl + "/" + photo.getObjectKey())
                .toList();
        String profileImgUrl = p.getUser().getProfileImageObjectKey() != null
                ? s3BaseUrl + "/" + p.getUser().getProfileImageObjectKey()
                : null;
        return new PostResponse(
                p.getId(), p.getUser().getId(), p.getUser().getNickname(), profileImgUrl,
                p.getCategory(), p.getTitle(), p.getContent(), urls,
                likeCount, myReactionType, reactionCounts != null ? reactionCounts : Map.of(),
                commentCount, p.getViewCount(), p.getCreatedAt());
    }
}
