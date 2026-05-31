package com.starterkit.domain.prompt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "family_prompts", indexes = {
        @Index(name = "idx_prompt_sender_sent_at", columnList = "sender_id, sent_at"),
        @Index(name = "idx_prompt_recipient_status", columnList = "recipient_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_group_id", nullable = false)
    private Long familyGroupId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_code", nullable = false, length = 20)
    private PromptTemplate templateCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private PromptStatus status = PromptStatus.PENDING;

    @Column(name = "reminder_sent", nullable = false)
    @Builder.Default
    private boolean reminderSent = false;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "linked_checkin_id")
    private Long linkedCheckinId;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
