package com.starterkit.domain.checkin.dto.response;

import com.starterkit.domain.checkin.entity.Category;

public record CategoryStats(Category category, long count) {
}
