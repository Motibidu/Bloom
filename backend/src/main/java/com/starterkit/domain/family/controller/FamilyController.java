package com.starterkit.domain.family.controller;

import com.starterkit.domain.family.dto.request.CreateFamilyRequest;
import com.starterkit.domain.family.dto.request.JoinFamilyRequest;
import com.starterkit.domain.family.dto.response.FamilyFeedResponse;
import com.starterkit.domain.family.dto.response.FamilyGroupResponse;
import com.starterkit.domain.family.dto.response.FamilyPreviewResponse;
import com.starterkit.domain.family.service.FamilyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
@Tag(name = "Family", description = "가족 연결 관련 API")
@SecurityRequirement(name = "bearerAuth")
public class FamilyController {

    private final FamilyService familyService;

    @GetMapping("/preview")
    @Operation(summary = "초대 코드 미리보기", description = "비인증 상태에서 초대 코드의 그룹 정보를 조회합니다.")
    public ResponseEntity<FamilyPreviewResponse> getPreview(
            @RequestParam("inviteCode") String inviteCode) {
        return ResponseEntity.ok(familyService.getPreview(inviteCode));
    }

    @PostMapping
    @Operation(summary = "가족 그룹 생성", description = "가족 그룹을 생성하고 8자리 초대 코드를 반환합니다.")
    public ResponseEntity<FamilyGroupResponse> createFamily(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateFamilyRequest request) {
        return ResponseEntity.ok(familyService.createFamily(userDetails.getUsername(), request));
    }

    @PostMapping("/join")
    @Operation(summary = "초대 코드로 가족 그룹 가입", description = "8자리 초대 코드를 이용해 가족 그룹에 가입합니다. 기존 멤버에게 이메일 알림이 발송됩니다.")
    public ResponseEntity<FamilyGroupResponse> joinFamily(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody JoinFamilyRequest request) {
        return ResponseEntity.ok(familyService.joinFamily(userDetails.getUsername(), request));
    }

    @GetMapping("/my")
    @Operation(summary = "내 가족 그룹 조회", description = "현재 사용자가 속한 가족 그룹과 멤버 목록을 반환합니다.")
    public ResponseEntity<FamilyGroupResponse> getMyFamily(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(familyService.getMyFamily(userDetails.getUsername()));
    }

    @GetMapping("/{id}/feed")
    @Operation(summary = "가족 피드 조회", description = "가족 멤버들의 체크인 목록을 최신순으로 반환합니다.")
    public ResponseEntity<FamilyFeedResponse> getFamilyFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long groupId) {
        return ResponseEntity.ok(familyService.getFamilyFeed(userDetails.getUsername(), groupId));
    }

    @DeleteMapping("/{id}/members/me")
    @Operation(summary = "가족 그룹 나가기", description = "그룹에서 탈퇴합니다. OWNER 탈퇴 시 그룹이 해산됩니다. FAMILY_VIEWER 탈퇴 시 일반 회원으로 전환됩니다.")
    public ResponseEntity<Void> leaveFamily(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long groupId) {
        familyService.leaveFamily(userDetails.getUsername(), groupId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
