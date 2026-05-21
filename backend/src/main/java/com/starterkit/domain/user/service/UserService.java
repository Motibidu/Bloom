package com.starterkit.domain.user.service;

import com.starterkit.domain.user.dto.request.UpdateProfileRequest;
import com.starterkit.domain.user.dto.response.ProfileImageUploadUrlResponse;
import com.starterkit.domain.user.dto.response.UserResponse;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.exception.NicknameDuplicateException;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String s3Bucket;

    @Value("${app.s3.region}")
    private String s3Region;

    private String s3BaseUrl() {
        return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com";
    }

    public UserResponse findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return UserResponse.from(user, s3BaseUrl());
    }

    public User findUserEntityByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public Map<String, Boolean> checkNickname(String nickname) {
        boolean available = !userRepository.existsByNickname(nickname);
        return Map.of("available", available);
    }

    public ProfileImageUploadUrlResponse generateProfileImageUploadUrl(Long userId) {
        String ext = "jpg";
        String objectKey = "profiles/" + userId + "/" + UUID.randomUUID() + "." + ext;

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(objectKey)
                .contentType("image/jpeg")
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))
                .putObjectRequest(putRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);
        return new ProfileImageUploadUrlResponse(
                presigned.url().toString(),
                objectKey,
                600L);
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        // 닉네임 중복 검증 (본인 제외)
        if (!user.getNickname().equals(req.nickname())) {
            if (userRepository.existsByNickname(req.nickname())) {
                throw new NicknameDuplicateException("이미 사용 중인 닉네임입니다.");
            }
        }

        user.setNickname(req.nickname());
        user.setBio(req.bio() != null ? req.bio().trim() : null);

        // 프로필 이미지 objectKey 업데이트 (prefix 검증)
        if (req.profileImageObjectKey() != null) {
            String expectedPrefix = "profiles/" + user.getId() + "/";
            if (!req.profileImageObjectKey().startsWith(expectedPrefix)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "잘못된 이미지 경로입니다.");
            }
            user.setProfileImageObjectKey(req.profileImageObjectKey());
        }

        return UserResponse.from(user, s3BaseUrl());
    }
}
