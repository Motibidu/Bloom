package com.starterkit.domain.prompt.dto.response;

public record SendPromptResponse(
        Long id,
        boolean warning,
        long weeklyCount
) {}
