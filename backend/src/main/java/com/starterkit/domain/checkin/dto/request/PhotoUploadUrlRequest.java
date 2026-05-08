package com.starterkit.domain.checkin.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PhotoUploadUrlRequest(
        @NotBlank String filename,
        @NotBlank String contentType) {
}
