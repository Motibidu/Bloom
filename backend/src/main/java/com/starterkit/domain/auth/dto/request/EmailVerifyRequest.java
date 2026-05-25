package com.starterkit.domain.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailVerifyRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 6) String code) {
}
