package com.starterkit.domain.like.dto.response;

import com.starterkit.domain.like.entity.ReactionType;

import java.util.Map;

public record LikeResponse(
        boolean liked,
        ReactionType reactionType,
        Map<String, Long> reactionCounts
) {
}
