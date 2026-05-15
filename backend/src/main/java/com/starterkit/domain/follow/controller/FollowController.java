package com.starterkit.domain.follow.controller;

import com.starterkit.domain.follow.service.FollowService;
import com.starterkit.domain.user.dto.response.UserSearchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Follow", description = "팔로우")
public class FollowController {

    private final FollowService followService;

    @PostMapping("/api/users/{userId}/follow")
    @Operation(summary = "팔로우")
    public ResponseEntity<Void> follow(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        followService.follow(userId, userDetails);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/api/users/{userId}/follow")
    @Operation(summary = "언팔로우")
    public ResponseEntity<Void> unfollow(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        followService.unfollow(userId, userDetails);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/users/search")
    @Operation(summary = "사용자 닉네임 검색")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(
            @RequestParam String nickname,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.searchUsers(nickname, userDetails));
    }

    @GetMapping("/api/follows/following")
    @Operation(summary = "내가 팔로우하는 사람 목록")
    public ResponseEntity<List<UserSearchResponse>> getFollowingList(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.getFollowingList(userDetails));
    }

    @GetMapping("/api/follows/followers")
    @Operation(summary = "나를 팔로우하는 사람 목록")
    public ResponseEntity<List<UserSearchResponse>> getFollowersList(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.getFollowersList(userDetails));
    }
}
