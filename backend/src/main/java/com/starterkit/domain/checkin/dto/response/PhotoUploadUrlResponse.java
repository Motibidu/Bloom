package com.starterkit.domain.checkin.dto.response;

public record PhotoUploadUrlResponse(
        String uploadUrl,
        String objectKey,
        int expiresIn) {
}
