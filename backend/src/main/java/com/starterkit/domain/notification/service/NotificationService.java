package com.starterkit.domain.notification.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.starterkit.domain.notification.dto.response.NotificationResponse;
import com.starterkit.domain.notification.entity.FcmToken;
import com.starterkit.domain.notification.entity.Notification;
import com.starterkit.domain.notification.entity.NotificationType;
import com.starterkit.domain.notification.repository.FcmTokenRepository;
import com.starterkit.domain.notification.repository.NotificationRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final FcmTokenRepository fcmTokenRepository;
    private final NotificationRepository notificationRepository;

    // ── 인앱 알림 저장 ────────────────────────────────────────────────────────

    @Transactional
    public void sendInApp(Long recipientId, String actorNickname, NotificationType type,
                          Long checkinId, String message) {
        notificationRepository.save(
                Notification.builder()
                        .recipientId(recipientId)
                        .actorNickname(actorNickname)
                        .type(type)
                        .checkinId(checkinId)
                        .message(message)
                        .build()
        );
    }

    // ── 알림 목록 조회 ────────────────────────────────────────────────────────

    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(20)
                .map(NotificationResponse::from)
                .toList();
    }

    public long countUnread(Long userId) {
        return notificationRepository.countUnreadByRecipientId(userId);
    }

    // ── 읽음 처리 ─────────────────────────────────────────────────────────────

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("알림을 찾을 수 없습니다."));
        if (!notification.getRecipientId().equals(userId)) {
            throw new ResourceNotFoundException("알림을 찾을 수 없습니다.");
        }
        notification.setRead(true);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
    }

    // ── FCM 토큰 저장 ─────────────────────────────────────────────────────────

    @Transactional
    public void saveFcmToken(Long userId, String token) {
        fcmTokenRepository.findByToken(token).ifPresentOrElse(
                existing -> {
                    if (!existing.getUserId().equals(userId)) {
                        existing.setUserId(userId);
                        log.info("FCM 토큰 userId 갱신: userId={}", userId);
                    }
                },
                () -> fcmTokenRepository.save(
                        FcmToken.builder()
                                .userId(userId)
                                .token(token)
                                .build()
                )
        );
    }

    @Async
    public void sendPush(Long userId, String title, String body) {
        List<FcmToken> tokens = loadFcmTokens(userId);
        sendFcmToTokens(tokens, title, body);
    }

    @Transactional(readOnly = true)
    public List<FcmToken> loadFcmTokens(Long userId) {
        return fcmTokenRepository.findByUserId(userId);
    }

    private void sendFcmToTokens(List<FcmToken> tokens, String title, String body) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.debug("Firebase 미초기화 — FCM 발송 skip");
            return;
        }
        if (tokens.isEmpty()) return;

        for (FcmToken fcmToken : tokens) {
            try {
                Message message = Message.builder()
                        .setNotification(com.google.firebase.messaging.Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .putData("title", title)
                        .putData("body", body)
                        .setToken(fcmToken.getToken())
                        .build();
                String messageId = FirebaseMessaging.getInstance().send(message);
                log.info("FCM 발송 성공: messageId={}", messageId);
            } catch (Exception e) {
                log.warn("FCM 발송 실패: token={}, error={}", fcmToken.getToken(), e.getMessage());
                String msg = e.getMessage() != null ? e.getMessage() : "";
                if (msg.contains("UNREGISTERED") || msg.contains("NotRegistered") || msg.contains("unregistered")) {
                    fcmTokenRepository.deleteByToken(fcmToken.getToken());
                    log.info("만료된 FCM 토큰 삭제");
                }
            }
        }
    }
}
