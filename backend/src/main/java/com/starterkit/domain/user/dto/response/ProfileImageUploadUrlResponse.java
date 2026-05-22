package com.starterkit.domain.user.dto.response;

public record ProfileImageUploadUrlResponse(String uploadUrl, String objectKey, long expiresIn) {
}
