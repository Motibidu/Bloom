package com.starterkit.domain.prompt.repository;

import com.starterkit.domain.prompt.entity.FamilyPrompt;
import com.starterkit.domain.prompt.entity.PromptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FamilyPromptRepository extends JpaRepository<FamilyPrompt, Long> {

    long countBySenderIdAndSentAtBetween(Long senderId, LocalDateTime from, LocalDateTime to);

    List<FamilyPrompt> findByRecipientIdAndStatus(Long recipientId, PromptStatus status);

    @Query("SELECT fp FROM FamilyPrompt fp WHERE fp.status = 'PENDING' AND fp.reminderSent = false AND fp.sentAt < :cutoff")
    List<FamilyPrompt> findPendingOlderThan(@Param("cutoff") LocalDateTime cutoff);

    List<FamilyPrompt> findByStatusAndReminderSentFalseAndSentAtBefore(PromptStatus status, LocalDateTime threshold);
}
