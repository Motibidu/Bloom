package com.starterkit.domain.family.dto.response;

import java.util.List;

public record FamilyPreviewResponse(
        String groupName,
        long memberCount,
        List<String> memberNicknames
) {}
