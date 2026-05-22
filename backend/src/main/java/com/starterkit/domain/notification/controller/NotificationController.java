package com.starterkit.domain.notification.controller;

import com.starterkit.domain.notification.dto.request.SaveFcmTokenRequest;
import com.starterkit.domain.notification.dto.response.NotificationResponse;
import com.starterkit.domain.notification.service.NotificationService;
import com.starterkit.domain.user.entity.User;
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
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "알림 API")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    // ── FCM 토큰 저장 (기존) ──────────────────────────────────────────────────

    @PostMapping("/push-tokens")
    @Operation(summary = "FCM 토큰 저장")
    public ResponseEntity<Void> saveFcmToken(
            @Valid @RequestBody SaveFcmTokenRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        notificationService.saveFcmToken(userId, request.token());
        return ResponseEntity.ok().build();
    }

    // ── 알림 목록 조회 ────────────────────────────────────────────────────────

    @GetMapping("/notifications")
    @Operation(summary = "최근 알림 20개 조회")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/notifications/unread-count")
    @Operation(summary = "미읽음 알림 수 조회")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    // ── 읽음 처리 ─────────────────────────────────────────────────────────────

    @PatchMapping("/notifications/{id}/read")
    @Operation(summary = "단건 알림 읽음 처리")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/notifications/read-all")
    @Operation(summary = "전체 알림 읽음 처리")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
