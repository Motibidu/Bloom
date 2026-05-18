package com.starterkit.domain.checkin.dto.response;

import com.starterkit.domain.checkin.entity.Category;
import com.starterkit.domain.checkin.entity.Checkin;
import com.starterkit.domain.like.entity.ReactionType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
        ReactionType myReactionType,
        Map<String, Long> reactionCounts,
        long commentCount,
        long viewCount,
        LocalDateTime createdAt,
        boolean isSimple) {

    /**
     * reactionCounts 없는 팩토리 (내부 조회용 간략 버전).
     */
    public static CheckinResponse of(Checkin c, long likeCount, boolean likedByMe, long commentCount, String s3BaseUrl) {
        return of(c, likeCount, likedByMe, null, Map.of(), commentCount, s3BaseUrl);
    }


    /**
     * 리액션 집계 포함 팩토리 (피드/상세 조회용).
     */
    public static CheckinResponse of(Checkin c, long likeCount, boolean likedByMe,
                                     ReactionType myReactionType, Map<String, Long> reactionCounts,
                                     long commentCount, String s3BaseUrl) {
        List<String> urls = c.getPhotos().stream()
                .map(p -> s3BaseUrl + "/" + p.getObjectKey())
                .toList();
        if (urls.isEmpty() && c.getPhotoObjectKey() != null) {
            urls = List.of(s3BaseUrl + "/" + c.getPhotoObjectKey());
        }
        return new CheckinResponse(
                c.getId(), c.getUser().getId(), c.getUser().getNickname(),
                c.getCategory(), c.getTitle(), c.getDescription(), urls,
                likeCount, likedByMe, myReactionType,
                reactionCounts != null ? reactionCounts : Map.of(),
                commentCount, c.getViewCount(), c.getCreatedAt(), c.isSimple());
    }
}
