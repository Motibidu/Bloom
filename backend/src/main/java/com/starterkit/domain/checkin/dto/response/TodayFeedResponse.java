package com.starterkit.domain.checkin.dto.response;

import java.util.List;

public record TodayFeedResponse(
        List<CheckinResponse> checkins,
        long sameCategoryUserCount,
        List<ActivitySummaryItem> activitySummary,
        long totalCheckinCount,
        Long nextCursor,
        boolean hasMore
) {
    /** 하위 호환: 기존 코드가 4-arg 생성자로 생성하는 경우를 위한 정적 팩토리 */
    public static TodayFeedResponse of(List<CheckinResponse> checkins,
                                       long sameCategoryUserCount,
                                       List<ActivitySummaryItem> activitySummary,
                                       long totalCheckinCount,
                                       Long nextCursor,
                                       boolean hasMore) {
        return new TodayFeedResponse(checkins, sameCategoryUserCount, activitySummary, totalCheckinCount, nextCursor, hasMore);
    }
}
