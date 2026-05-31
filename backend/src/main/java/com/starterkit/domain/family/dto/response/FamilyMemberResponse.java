package com.starterkit.domain.family.dto.response;

import com.starterkit.domain.family.entity.FamilyMember;
import com.starterkit.domain.family.entity.FamilyMemberRole;

public record FamilyMemberResponse(
        Long userId,
        String nickname,
        FamilyMemberRole role,
        String profileImageUrl
) {
    public static FamilyMemberResponse of(FamilyMember fm, String s3BaseUrl) {
        String profileImageUrl = null;
        String objectKey = fm.getUser().getProfileImageObjectKey();
        if (s3BaseUrl != null && objectKey != null) {
            profileImageUrl = s3BaseUrl + "/" + objectKey;
        }
        return new FamilyMemberResponse(
                fm.getUser().getId(),
                fm.getUser().getNickname(),
                fm.getRole(),
                profileImageUrl
        );
    }
}
