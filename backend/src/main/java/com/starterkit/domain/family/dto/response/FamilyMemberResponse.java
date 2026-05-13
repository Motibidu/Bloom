package com.starterkit.domain.family.dto.response;

import com.starterkit.domain.family.entity.FamilyMember;

public record FamilyMemberResponse(
        Long userId,
        String nickname
) {
    public static FamilyMemberResponse of(FamilyMember fm) {
        return new FamilyMemberResponse(fm.getUser().getId(), fm.getUser().getNickname());
    }
}
