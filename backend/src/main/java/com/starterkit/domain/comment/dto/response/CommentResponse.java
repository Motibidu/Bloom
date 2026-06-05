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
        String content,
        LocalDateTime createdAt,
        CommentType commentType,
        PraiseCardType praiseCardType,
        Long parentId,
        List<CommentResponse> replies
) {
    public static CommentResponse from(Comment comment) {
        List<CommentResponse> replyList = comment.getReplies().stream()
                .map(CommentResponse::fromReply)
                .toList();
        return new CommentResponse(
                comment.getId(),
                comment.getUser().getId(),
                comment.getUser().getNickname(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getCommentType(),
                comment.getPraiseCardType(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                replyList
        );
    }

    public static CommentResponse fromReply(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getUser().getId(),
                comment.getUser().getNickname(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getCommentType(),
                comment.getPraiseCardType(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                List.of()
        );
    }
}
