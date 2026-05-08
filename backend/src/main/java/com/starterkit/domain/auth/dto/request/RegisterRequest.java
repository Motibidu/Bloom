package com.starterkit.domain.auth.dto.request;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8)
        @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$", message = "비밀번호는 영문과 숫자를 모두 포함해야 합니다")
        String password,
        @NotBlank @Size(min = 2, max = 12)
        @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$", message = "닉네임은 한글, 영문, 숫자만 사용 가능합니다")
        String nickname,
        @Size(max = 50) String bio) {
}
