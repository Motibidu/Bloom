package com.starterkit.domain.notification.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.starterkit.domain.notification.entity.FcmToken;
import com.starterkit.domain.notification.repository.FcmTokenRepository;
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
                        .setNotification(Notification.builder()
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
