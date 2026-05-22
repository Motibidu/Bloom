package com.starterkit.domain.checkin.dto.request;

import com.starterkit.domain.checkin.entity.Category;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCheckinRequest(
        @NotNull Category category,
        @Size(max = 50) String title,
        @Size(max = 300) String description) {
}
