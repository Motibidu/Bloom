package com.starterkit.domain.checkin.controller;

import com.starterkit.domain.checkin.dto.request.CreateCheckinRequest;
import com.starterkit.domain.checkin.dto.request.PhotoUploadUrlRequest;
import com.starterkit.domain.checkin.dto.response.*;
import com.starterkit.domain.checkin.service.CheckinService;
import com.starterkit.domain.follow.service.FollowService;
import com.starterkit.domain.user.dto.response.UserSearchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
@Tag(name = "Checkins", description = "체크인 관련 API")
@SecurityRequirement(name = "bearerAuth")
public class CheckinController {

    private final CheckinService checkinService;
    private final FollowService followService;

    @PostMapping
    @Operation(summary = "체크인 생성")
    public ResponseEntity<CheckinResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateCheckinRequest request) {
        return ResponseEntity.ok(checkinService.create(userDetails.getUsername(), request));
    }

    @GetMapping("/today/same-category-users")
    @Operation(summary = "오늘 같은 카테고리를 기록한 사용자 목록 조회")
    public ResponseEntity<List<UserSearchResponse>> getSameCategoryUsers(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(checkinService.getSameCategoryUsers(userDetails.getUsername()));
    }

    @GetMapping("/today")
    @Operation(summary = "오늘의 피드 조회 (KST 기준)")
    public ResponseEntity<TodayFeedResponse> getToday(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "all") String feedType) {
        List<Long> followingIds = "following".equals(feedType)
                ? followService.getFollowingIds(userDetails)
                : null;
        return ResponseEntity.ok(checkinService.getTodayFeed(userDetails.getUsername(), followingIds));
    }

    @GetMapping("/my/calendar")
    @Operation(summary = "내 월별 캘린더 조회")
    public ResponseEntity<List<CalendarDayEntry>> getMyCalendar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(checkinService.getMyCalendar(userDetails.getUsername(), year, month));
    }

    @GetMapping("/my/stats")
    @Operation(summary = "내 카테고리별 통계 조회")
    public ResponseEntity<List<CategoryStats>> getMyStats(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(checkinService.getMyCategoryStats(userDetails.getUsername(), year, month));
    }

    @GetMapping("/my")
    @Operation(summary = "내 체크인 목록 조회 (날짜별)")
    public ResponseEntity<List<CheckinResponse>> getMy(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String date) {
        return ResponseEntity.ok(checkinService.getMyCheckins(userDetails.getUsername(), date));
    }

    @PostMapping("/photo-upload-url")
    @Operation(summary = "사진 업로드 Presigned URL 발급")
    public ResponseEntity<PhotoUploadUrlResponse> getPhotoUploadUrl(
            @Valid @RequestBody PhotoUploadUrlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(checkinService.generatePhotoUploadUrl(request, userDetails));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "체크인 삭제")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id) {
        checkinService.delete(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "체크인 상세 조회")
    public ResponseEntity<CheckinResponse> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(checkinService.getById(userDetails.getUsername(), id));
    }
}
