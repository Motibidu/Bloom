package com.starterkit.domain.prompt.dto.request;

import jakarta.validation.constraints.NotNull;

public record RespondPromptRequest(
        @NotNull Long checkinId
) {}
