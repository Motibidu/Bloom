package com.starterkit.domain.prompt.scheduler;

import com.starterkit.domain.notification.service.NotificationService;
import com.starterkit.domain.prompt.entity.FamilyPrompt;
import com.starterkit.domain.prompt.entity.PromptStatus;
import com.starterkit.domain.prompt.repository.FamilyPromptRepository;
import com.starterkit.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PromptReminderScheduler {

    private static final long REMINDER_HOURS = 48;

    private final FamilyPromptRepository familyPromptRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Scheduled(fixedDelay = 3_600_000) // 1시간마다
    @Transactional
    public void sendReminders() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(REMINDER_HOURS);
        List<FamilyPrompt> targets = familyPromptRepository
                .findByStatusAndReminderSentFalseAndSentAtBefore(PromptStatus.PENDING, threshold);

        if (targets.isEmpty()) return;

        log.info("프롬프트 리마인드 대상: {}건", targets.size());

        for (FamilyPrompt prompt : targets) {
            try {
                String senderNickname = userRepository.findById(prompt.getSenderId())
                        .map(u -> u.getNickname() != null ? u.getNickname() : "가족")
                        .orElse("가족");

                notificationService.sendPush(
                        prompt.getRecipientId(),
                        "아직 답하지 않은 초대가 있어요",
                        senderNickname + "님의 초대: " + prompt.getTemplateCode().getLabel()
                );

                prompt.setReminderSent(true);
                prompt.setStatus(PromptStatus.REMINDED);
                log.debug("리마인드 발송 완료: promptId={}", prompt.getId());
            } catch (Exception e) {
                log.warn("리마인드 발송 실패: promptId={}, error={}", prompt.getId(), e.getMessage());
            }
        }
    }
}
