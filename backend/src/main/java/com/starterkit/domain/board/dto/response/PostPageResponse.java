package com.starterkit.domain.board.dto.response;

import java.util.List;

public record PostPageResponse(
        List<PostSummaryResponse> posts,
        int currentPage,
        int totalPages,
        long totalElements) {
}
