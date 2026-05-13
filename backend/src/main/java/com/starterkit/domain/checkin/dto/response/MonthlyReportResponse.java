package com.starterkit.domain.checkin.dto.response;

import java.util.List;
import java.util.Map;

public record MonthlyReportResponse(
        int year,
        int month,
        int totalDays,
        int totalCheckins,
        Map<String, Integer> categoryStats,
        List<Integer> activeDays,
        String mostActiveCategory,
        int currentStreak,
        int longestStreak
) {}
