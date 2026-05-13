package com.starterkit.domain.family.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFamilyRequest(
        @NotBlank(message = "가족 그룹 이름을 입력해주세요.")
        @Size(max = 20, message = "그룹 이름은 20자 이내로 입력해주세요.")
        String name
) {}
