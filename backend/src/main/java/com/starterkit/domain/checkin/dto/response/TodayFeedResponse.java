package com.starterkit.domain.checkin.dto.response;

import java.util.List;

public record TodayFeedResponse(List<CheckinResponse> checkins, long sameCategoryUserCount, List<ActivitySummaryItem> activitySummary) {
}
