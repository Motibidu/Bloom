package com.starterkit.domain.family.dto.request;

import jakarta.validation.constraints.NotBlank;

public record JoinFamilyRequest(
        @NotBlank(message = "초대 코드를 입력해주세요.")
        String inviteCode
) {}
