package com.starterkit.domain.user.controller;

import com.starterkit.domain.checkin.dto.response.MonthlyReportResponse;
import com.starterkit.domain.checkin.service.CheckinService;
import com.starterkit.domain.user.dto.request.UpdateProfileRequest;
import com.starterkit.domain.user.dto.response.ProfileImageUploadUrlResponse;
import com.starterkit.domain.user.dto.response.UserResponse;
import com.starterkit.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
@Tag(name = "Users", description = "사용자 조회")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final CheckinService checkinService;

    @GetMapping("/me")
    @Operation(summary = "내 프로필 조회")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.findByEmail(userDetails.getUsername()));
    }

    @GetMapping("/me/monthly-report")
    @Operation(summary = "월간 리포트 조회", description = "year, month 파라미터로 해당 월의 활동 통계를 반환합니다.")
    public ResponseEntity<MonthlyReportResponse> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(checkinService.getMonthlyReport(userDetails.getUsername(), year, month));
    }

    @PostMapping("/me/profile-image-url")
    @Operation(summary = "프로필 이미지 업로드 Presigned URL 발급")
    public ResponseEntity<ProfileImageUploadUrlResponse> getProfileImageUploadUrl(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        com.starterkit.domain.user.entity.User user =
                userService.findUserEntityByEmail(email);
        return ResponseEntity.ok(userService.generateProfileImageUploadUrl(user.getId()));
    }

    @PatchMapping("/me")
    @Operation(summary = "내 프로필 수정", description = "닉네임, 자기소개를 수정합니다. 닉네임 중복 시 409 반환.")
    public ResponseEntity<UserResponse> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getUsername(), request));
    }

    @GetMapping("/check-nickname")
    @Operation(summary = "닉네임 중복 확인", description = "닉네임 사용 가능 여부를 반환합니다. 인증 불필요.")
    @SecurityRequirement(name = "")
    public ResponseEntity<Map<String, Boolean>> checkNickname(
            @RequestParam @NotBlank @Size(min = 2, max = 12) String nickname) {
        return ResponseEntity.ok(userService.checkNickname(nickname));
    }
}
