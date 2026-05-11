package com.starterkit.domain.checkin.dto.request;

import com.starterkit.domain.checkin.entity.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateCheckinRequest(
        @NotNull Category category,
        @NotBlank @Size(max = 50) String title,
        @NotBlank @Size(max = 100) String description,
        @Size(max = 3) List<String> photoObjectKeys) {
}
