package com.starterkit.domain.like.dto.request;

import com.starterkit.domain.like.entity.ReactionType;

public record LikeRequest(ReactionType reactionType) {

    public ReactionType resolvedReactionType() {
        return reactionType != null ? reactionType : ReactionType.LIKE;
    }
}
