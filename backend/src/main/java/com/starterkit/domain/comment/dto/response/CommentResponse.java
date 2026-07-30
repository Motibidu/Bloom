package com.starterkit.domain.comment.dto.response;

import com.starterkit.domain.comment.entity.Comment;
import com.starterkit.domain.comment.entity.CommentType;
import com.starterkit.domain.comment.entity.PraiseCardType;

import java.time.LocalDateTime;
import java.util.List;

public record CommentResponse(
        Long id,
        Long userId,
        String nickname,
        String profileImageUrl,
        String content,
        LocalDateTime createdAt,
        CommentType commentType,
        PraiseCardType praiseCardType,
        Long parentId,
        List<CommentResponse> replies
) {
    public static CommentResponse from(Comment comment, String s3BaseUrl) {
        List<CommentResponse> replyList = comment.getReplies().stream()
                .map(reply -> CommentResponse.fromReply(reply, s3BaseUrl))
                .toList();
        return new CommentResponse(
                comment.getId(),
                comment.getUser().getId(),
                comment.getUser().getNickname(),
                resolveProfileImageUrl(comment, s3BaseUrl),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getCommentType(),
                comment.getPraiseCardType(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                replyList
        );
    }

    public static CommentResponse fromReply(Comment comment, String s3BaseUrl) {
        return new CommentResponse(
                comment.getId(),
                comment.getUser().getId(),
                comment.getUser().getNickname(),
                resolveProfileImageUrl(comment, s3BaseUrl),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getCommentType(),
                comment.getPraiseCardType(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                List.of()
        );
    }

    private static String resolveProfileImageUrl(Comment comment, String s3BaseUrl) {
        return comment.getUser().getProfileImageObjectKey() != null
                ? s3BaseUrl + "/" + comment.getUser().getProfileImageObjectKey()
                : null;
    }
}
