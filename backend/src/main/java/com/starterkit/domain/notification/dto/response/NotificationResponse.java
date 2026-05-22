package com.starterkit.domain.notification.dto.response;

import com.starterkit.domain.notification.entity.Notification;
import com.starterkit.domain.notification.entity.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String actorNickname,
        NotificationType type,
        Long checkinId,
        String message,
        boolean isRead,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getActorNickname(),
                n.getType(),
                n.getCheckinId(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
