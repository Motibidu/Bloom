package com.starterkit.domain.notification.controller;

import com.starterkit.domain.notification.dto.request.SaveFcmTokenRequest;
import com.starterkit.domain.notification.service.NotificationService;
import com.starterkit.domain.user.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "푸시 알림 구독 관련 API")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/push-tokens")
    @Operation(summary = "FCM 토큰 저장")
    public ResponseEntity<Void> saveFcmToken(
            @Valid @RequestBody SaveFcmTokenRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        notificationService.saveFcmToken(userId, request.token());
        return ResponseEntity.ok().build();
    }
}
