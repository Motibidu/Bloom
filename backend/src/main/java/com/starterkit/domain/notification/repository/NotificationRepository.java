package com.starterkit.domain.notification.repository;

import com.starterkit.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId AND n.isRead = false")
    long countUnreadByRecipientId(Long recipientId);
}
