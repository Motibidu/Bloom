package com.starterkit.domain.comment.dto.request;

import com.starterkit.domain.comment.entity.CommentType;
import com.starterkit.domain.comment.entity.PraiseCardType;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @Size(max = 200) String content,
        CommentType commentType,
        PraiseCardType praiseCardType
) {
    public CommentType resolvedCommentType() {
        return commentType != null ? commentType : CommentType.TEXT;
    }
}
