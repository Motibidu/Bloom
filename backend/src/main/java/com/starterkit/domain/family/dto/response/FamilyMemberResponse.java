package com.starterkit.domain.family.dto.response;

import com.starterkit.domain.family.entity.FamilyMember;
import com.starterkit.domain.family.entity.FamilyMemberRole;

public record FamilyMemberResponse(
        Long userId,
        String nickname,
        FamilyMemberRole role
) {
    public static FamilyMemberResponse of(FamilyMember fm) {
        return new FamilyMemberResponse(
                fm.getUser().getId(),
                fm.getUser().getNickname(),
                fm.getRole()
        );
    }
}
