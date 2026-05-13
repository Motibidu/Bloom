package com.starterkit.domain.family.dto.response;

import com.starterkit.domain.checkin.dto.response.CheckinResponse;

import java.util.List;

public record FamilyFeedResponse(
        Long groupId,
        String groupName,
        List<CheckinResponse> checkins
) {}
