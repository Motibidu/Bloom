package com.starterkit.domain.prompt.dto.request;

import com.starterkit.domain.prompt.entity.PromptTemplate;
import jakarta.validation.constraints.NotNull;

public record SendPromptRequest(
        @NotNull Long recipientId,
        @NotNull PromptTemplate templateCode
) {}
