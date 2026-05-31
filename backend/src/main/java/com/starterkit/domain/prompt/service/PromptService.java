package com.starterkit.domain.prompt.service;

import com.starterkit.domain.family.entity.FamilyMember;
import com.starterkit.domain.family.repository.FamilyMemberRepository;
import com.starterkit.domain.notification.entity.NotificationType;
import com.starterkit.domain.notification.service.NotificationService;
import com.starterkit.domain.prompt.dto.request.RespondPromptRequest;
import com.starterkit.domain.prompt.dto.request.SendPromptRequest;
import com.starterkit.domain.prompt.dto.response.ReceivedPromptResponse;
import com.starterkit.domain.prompt.dto.response.SendPromptResponse;
import com.starterkit.domain.prompt.entity.FamilyPrompt;
import com.starterkit.domain.prompt.entity.PromptStatus;
import com.starterkit.domain.prompt.entity.PromptTemplate;
import com.starterkit.domain.prompt.repository.FamilyPromptRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromptService {

    private static final int WEEKLY_WARN_THRESHOLD = 5;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final FamilyPromptRepository familyPromptRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public SendPromptResponse sendPrompt(Long senderId, SendPromptRequest req) {
        // 발신자의 가족 그룹 조회
        List<FamilyMember> senderMembers = familyMemberRepository.findByUserId(senderId);
        if (senderMembers.isEmpty()) {
            throw new ResourceNotFoundException("가족 그룹에 속해 있지 않습니다.");
        }
        FamilyMember senderMember = senderMembers.get(0);
        Long groupId = senderMember.getGroup().getId();

        // 수신자가 같은 가족 그룹인지 검증
        if (!familyMemberRepository.existsByGroupIdAndUserId(groupId, req.recipientId())) {
            throw new ResourceNotFoundException("수신자가 가족 그룹에 속해 있지 않습니다.");
        }

        // 주간 발송 횟수 계산 (월~일 KST)
        LocalDateTime weekStart = LocalDate.now(KST)
                .with(DayOfWeek.MONDAY)
                .atStartOfDay();
        LocalDateTime weekEnd = LocalDate.now(KST)
                .with(DayOfWeek.SUNDAY)
                .atTime(LocalTime.MAX);

        long weeklyCount = familyPromptRepository.countBySenderIdAndSentAtBetween(senderId, weekStart, weekEnd);
        boolean warning = weeklyCount >= WEEKLY_WARN_THRESHOLD;

        FamilyPrompt prompt = familyPromptRepository.save(
                FamilyPrompt.builder()
                        .familyGroupId(groupId)
                        .senderId(senderId)
                        .recipientId(req.recipientId())
                        .direction(req.direction())
                        .templateCode(req.templateCode())
                        .build()
        );

        // 발신자 닉네임 조회
        String senderNickname = userRepository.findById(senderId)
                .map(u -> u.getNickname() != null ? u.getNickname() : "가족")
                .orElse("가족");

        // 인앱 알림 저장 (checkinId 자리에 promptId 활용)
        notificationService.sendInApp(
                req.recipientId(),
                senderNickname,
                NotificationType.PROMPT,
                prompt.getId(),
                req.templateCode().getLabel() + " 기록해볼까요?"
        );

        // FCM 푸시 알림 (비동기)
        notificationService.sendPush(
                req.recipientId(),
                "공유 초대가 도착했어요",
                senderNickname + "님: " + req.templateCode().getLabel()
        );

        return new SendPromptResponse(prompt.getId(), warning, weeklyCount + 1);
    }

    public List<Map<String, String>> getTemplates() {
        return Arrays.stream(PromptTemplate.values())
                .map(t -> Map.of("code", t.name(), "label", t.getLabel()))
                .collect(Collectors.toList());
    }

    public List<ReceivedPromptResponse> getReceivedPrompts(Long userId) {
        List<FamilyPrompt> pending = familyPromptRepository.findByRecipientIdAndStatusIn(
                userId, List.of(PromptStatus.PENDING, PromptStatus.REMINDED));

        // 발신자 닉네임 일괄 조회
        List<Long> senderIds = pending.stream().map(FamilyPrompt::getSenderId).distinct().toList();
        Map<Long, String> nicknameMap = userRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u.getNickname() != null ? u.getNickname() : ""));

        return pending.stream()
                .map(p -> ReceivedPromptResponse.of(p, nicknameMap.getOrDefault(p.getSenderId(), "")))
                .toList();
    }

    @Transactional
    public void respondToPrompt(Long promptId, RespondPromptRequest req, Long userId) {
        FamilyPrompt prompt = familyPromptRepository.findById(promptId)
                .orElseThrow(() -> new ResourceNotFoundException("프롬프트를 찾을 수 없습니다."));

        if (!prompt.getRecipientId().equals(userId)) {
            throw new ResourceNotFoundException("프롬프트에 접근할 수 없습니다.");
        }

        prompt.setStatus(PromptStatus.RESPONDED);
        prompt.setLinkedCheckinId(req.checkinId());
        prompt.setRespondedAt(LocalDateTime.now());
    }

    @Transactional
    public void dismissPrompt(Long promptId, Long userId) {
        FamilyPrompt prompt = familyPromptRepository.findById(promptId)
                .orElseThrow(() -> new ResourceNotFoundException("프롬프트를 찾을 수 없습니다."));

        if (!prompt.getRecipientId().equals(userId)) {
            throw new ResourceNotFoundException("프롬프트에 접근할 수 없습니다.");
        }

        prompt.setStatus(PromptStatus.DISMISSED);
    }
}
