package com.starterkit.domain.comment.dto.response;

import com.starterkit.domain.comment.entity.Comment;
import com.starterkit.domain.comment.entity.CommentType;
import com.starterkit.domain.comment.entity.PraiseCardType;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long userId,
        String nickname,
        String content,
        LocalDateTime createdAt,
        CommentType commentType,
        PraiseCardType praiseCardType
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getUser().getId(),
                comment.getUser().getNickname(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getCommentType(),
                comment.getPraiseCardType()
        );
    }
}
