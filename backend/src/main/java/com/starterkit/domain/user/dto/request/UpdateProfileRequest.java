package com.starterkit.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(min = 2, max = 12) String nickname,
        @Size(max = 50) String bio,
        String profileImageObjectKey) {
}
