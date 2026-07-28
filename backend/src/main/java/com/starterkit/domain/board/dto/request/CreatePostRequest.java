package com.starterkit.domain.board.dto.request;

import com.starterkit.domain.board.entity.PostCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePostRequest(
        @NotNull PostCategory category,
        @NotBlank @Size(max = 50) String title,
        @NotBlank @Size(max = 2000) String content,
        @Size(max = 3) List<String> photoObjectKeys) {
}
