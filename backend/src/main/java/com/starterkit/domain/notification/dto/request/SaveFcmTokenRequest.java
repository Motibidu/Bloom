package com.starterkit.domain.notification.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SaveFcmTokenRequest(
        @NotBlank String token
) {}
