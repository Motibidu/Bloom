package com.starterkit.domain.checkin.dto.response;

import com.starterkit.domain.checkin.entity.Category;
import java.util.List;

public record ActivitySummaryItem(Category category, long count, List<String> previewNicknames) {
}
