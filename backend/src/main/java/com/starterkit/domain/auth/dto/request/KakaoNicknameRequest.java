package com.starterkit.domain.auth.dto.request;

import jakarta.validation.constraints.*;

public record KakaoNicknameRequest(
        @NotBlank @Size(min = 2, max = 12)
        @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$", message = "닉네임은 한글, 영문, 숫자만 사용 가능합니다")
        String nickname,
        @NotNull @Min(1900) @Max(2010) Integer birthYear) {
}
