package com.starterkit.domain.family.service;

import com.starterkit.domain.checkin.dto.response.CheckinResponse;
import com.starterkit.domain.checkin.entity.Checkin;
import com.starterkit.domain.checkin.repository.CheckinRepository;
import com.starterkit.domain.family.dto.request.CreateFamilyRequest;
import com.starterkit.domain.family.dto.request.JoinFamilyRequest;
import com.starterkit.domain.family.dto.response.FamilyFeedResponse;
import com.starterkit.domain.family.dto.response.FamilyGroupResponse;
import com.starterkit.domain.family.dto.response.FamilyMemberResponse;
import com.starterkit.domain.family.dto.response.FamilyPreviewResponse;
import com.starterkit.domain.family.entity.FamilyGroup;
import com.starterkit.domain.family.entity.FamilyMember;
import com.starterkit.domain.family.entity.FamilyMemberRole;
import com.starterkit.domain.family.exception.AlreadyInFamilyException;
import com.starterkit.domain.family.exception.FamilyNotFoundException;
import com.starterkit.domain.family.exception.InvalidInviteCodeException;
import com.starterkit.domain.family.repository.FamilyGroupRepository;
import com.starterkit.domain.family.repository.FamilyMemberRepository;
import com.starterkit.domain.like.entity.ReactionType;
import com.starterkit.domain.like.repository.LikeRepository;
import com.starterkit.domain.comment.repository.CommentRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.entity.UserRole;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;

@Slf4j
@Service
@Transactional(readOnly = true)
public class FamilyService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final CheckinRepository checkinRepository;
    private final LikeRepository likeRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public FamilyService(FamilyGroupRepository familyGroupRepository,
                         FamilyMemberRepository familyMemberRepository,
                         UserRepository userRepository,
                         CheckinRepository checkinRepository,
                         LikeRepository likeRepository) {
        this.familyGroupRepository = familyGroupRepository;
        this.familyMemberRepository = familyMemberRepository;
        this.userRepository = userRepository;
        this.checkinRepository = checkinRepository;
        this.likeRepository = likeRepository;
    }

    @Value("${app.s3.bucket}")
    private String s3Bucket;

    @Value("${app.s3.region}")
    private String s3Region;

    private String s3BaseUrl() {
        return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com";
    }

    @Transactional
    public FamilyGroupResponse createFamily(String email, CreateFamilyRequest request) {
        User user = findUserByEmail(email);

        String inviteCode = generateUniqueInviteCode();

        FamilyGroup group = familyGroupRepository.save(
                FamilyGroup.builder()
                        .name(request.name())
                        .inviteCode(inviteCode)
                        .createdBy(user)
                        .build()
        );

        FamilyMember ownerMember = familyMemberRepository.save(
                FamilyMember.builder()
                        .group(group)
                        .user(user)
                        .build()
        );

        long memberCount = 1L;
        List<FamilyMemberResponse> members = List.of(FamilyMemberResponse.of(ownerMember, s3BaseUrl()));

        return new FamilyGroupResponse(group.getId(), group.getName(), group.getInviteCode(),
                memberCount, group.getCreatedAt(), members);
    }

    @Transactional
    public FamilyGroupResponse joinFamily(String email, JoinFamilyRequest request) {
        User newMember = findUserByEmail(email);

        FamilyGroup group = familyGroupRepository.findByInviteCode(request.inviteCode())
                .orElseThrow(() -> new InvalidInviteCodeException("유효하지 않은 초대 코드입니다."));

        if (familyMemberRepository.existsByGroupIdAndUserId(group.getId(), newMember.getId())) {
            throw new AlreadyInFamilyException("이미 해당 가족 그룹의 멤버입니다.");
        }

        familyMemberRepository.save(
                FamilyMember.builder()
                        .group(group)
                        .user(newMember)
                        .role(com.starterkit.domain.family.entity.FamilyMemberRole.GUEST)
                        .build()
        );

        // 기존 멤버에게 비동기 이메일 알림
        List<FamilyMember> existingMembers = familyMemberRepository.findByGroupId(group.getId());
        List<String> existingEmails = existingMembers.stream()
                .map(fm -> fm.getUser().getEmail())
                .filter(e -> !e.equals(newMember.getEmail()))
                .toList();
        sendJoinNotificationAsync(existingEmails, newMember.getNickname(), group.getName());

        long memberCount = familyMemberRepository.countByGroupId(group.getId());
        String baseUrl = s3BaseUrl();
        List<FamilyMemberResponse> members = familyMemberRepository.findByGroupId(group.getId())
                .stream().map(fm -> FamilyMemberResponse.of(fm, baseUrl)).toList();

        return new FamilyGroupResponse(group.getId(), group.getName(), group.getInviteCode(),
                memberCount, group.getCreatedAt(), members);
    }

    public FamilyGroupResponse getMyFamily(String email) {
        User user = findUserByEmail(email);

        List<FamilyMember> myMemberships = familyMemberRepository.findByUserId(user.getId());
        if (myMemberships.isEmpty()) {
            throw new FamilyNotFoundException("속한 가족 그룹이 없습니다.");
        }

        // 가장 최근에 가입한 그룹 기준
        FamilyGroup group = myMemberships.get(myMemberships.size() - 1).getGroup();
        List<FamilyMember> members = familyMemberRepository.findByGroupId(group.getId());
        long memberCount = members.size();
        String baseUrl = s3BaseUrl();
        List<FamilyMemberResponse> memberResponses = members.stream()
                .map(fm -> FamilyMemberResponse.of(fm, baseUrl)).toList();

        return new FamilyGroupResponse(group.getId(), group.getName(), group.getInviteCode(),
                memberCount, group.getCreatedAt(), memberResponses);
    }

    public FamilyFeedResponse getFamilyFeed(String email, Long groupId) {
        User user = findUserByEmail(email);

        FamilyGroup group = familyGroupRepository.findById(groupId)
                .orElseThrow(() -> new FamilyNotFoundException("가족 그룹을 찾을 수 없습니다."));

        if (!familyMemberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            throw new FamilyNotFoundException("해당 가족 그룹의 멤버가 아닙니다.");
        }

        List<Long> memberUserIds = familyMemberRepository.findUserIdsByGroupId(groupId);
        List<Checkin> checkins = checkinRepository.findByUserIdsOrderByCreatedAtDesc(memberUserIds);

        if (checkins.isEmpty()) {
            return new FamilyFeedResponse(group.getId(), group.getName(), List.of());
        }

        List<Long> checkinIds = checkins.stream().map(Checkin::getId).toList();
        String baseUrl = s3BaseUrl();

        Map<Long, Long> likeCountMap = checkinRepository.countLikesByCheckinIds(checkinIds)
                .stream().collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
        Map<Long, Long> commentCountMap = checkinRepository.countCommentsByCheckinIds(checkinIds)
                .stream().collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        // 리액션 집계: checkinId → Map<reactionTypeName, count>
        Map<Long, Map<String, Long>> reactionCountsMap = new HashMap<>();
        List<Object[]> reactionBulk = likeRepository.countByReactionTypeForCheckinIds(checkinIds);
        for (Object[] row : reactionBulk) {
            Long cId = (Long) row[0];
            ReactionType rt = (ReactionType) row[1];
            Long cnt = (Long) row[2];
            reactionCountsMap.computeIfAbsent(cId, k -> new LinkedHashMap<>()).put(rt.name(), cnt);
        }

        // 내 리액션: checkinId → ReactionType
        Map<Long, ReactionType> myReactionMap = new HashMap<>();
        List<Object[]> myReactions = checkinRepository.findReactionsByUserIdAndCheckinIds(checkinIds, user.getId());
        for (Object[] row : myReactions) {
            myReactionMap.put((Long) row[0], (ReactionType) row[1]);
        }

        List<CheckinResponse> responses = checkins.stream()
                .map(c -> CheckinResponse.of(c,
                        likeCountMap.getOrDefault(c.getId(), 0L),
                        myReactionMap.containsKey(c.getId()),
                        myReactionMap.get(c.getId()),
                        reactionCountsMap.getOrDefault(c.getId(), Map.of()),
                        commentCountMap.getOrDefault(c.getId(), 0L),
                        baseUrl))
                .toList();

        return new FamilyFeedResponse(group.getId(), group.getName(), responses);
    }

    @Transactional
    public void leaveFamily(String email, Long groupId) {
        User user = findUserByEmail(email);

        FamilyMember membership = familyMemberRepository.findByGroupId(groupId).stream()
                .filter(fm -> fm.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElseThrow(() -> new FamilyNotFoundException("해당 가족 그룹의 멤버가 아닙니다."));

        if (membership.getRole() == FamilyMemberRole.OWNER) {
            // OWNER 탈퇴 → 그룹 전체 해산
            familyMemberRepository.deleteByGroupId(groupId);
            familyGroupRepository.deleteById(groupId);
        } else {
            // GUEST 탈퇴 → 멤버만 삭제
            familyMemberRepository.deleteByGroupIdAndUserId(groupId, user.getId());
        }

        // FAMILY_VIEWER였으면 일반 MEMBER로 전환
        if (user.getRole() == UserRole.FAMILY_VIEWER) {
            user.setRole(UserRole.MEMBER);
        }
    }

    @Async
    public void sendJoinNotificationAsync(List<String> recipientEmails, String joinerNickname, String groupName) {
        if (recipientEmails.isEmpty() || mailSender == null) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipientEmails.toArray(new String[0]));
            message.setSubject("[오늘 뭐 했어요?] " + joinerNickname + "님이 가족 그룹에 참여했어요!");
            message.setText(joinerNickname + "님이 '" + groupName + "' 가족 그룹에 새로 참여했습니다.\n\n앱에서 확인해보세요!");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("이메일 발송 실패: {}", e.getMessage());
        }
    }

    public FamilyPreviewResponse getPreview(String inviteCode) {
        FamilyGroup group = familyGroupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new InvalidInviteCodeException("유효하지 않은 초대 코드입니다."));

        List<FamilyMember> members = familyMemberRepository.findByGroupId(group.getId());
        List<String> nicknames = members.stream()
                .map(fm -> fm.getUser().getNickname())
                .limit(5)
                .toList();

        return new FamilyPreviewResponse(group.getName(), members.size(), nicknames);
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        } while (familyGroupRepository.existsByInviteCode(code));
        return code;
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }
}
