package com.starterkit.domain.family.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record FamilyGroupResponse(
        Long id,
        String name,
        String inviteCode,
        long memberCount,
        LocalDateTime createdAt,
        List<FamilyMemberResponse> members
) {}
