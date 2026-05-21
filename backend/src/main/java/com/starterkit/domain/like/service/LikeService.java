package com.starterkit.domain.like.service;

import com.starterkit.domain.checkin.entity.Checkin;
import com.starterkit.domain.checkin.repository.CheckinRepository;
import com.starterkit.domain.like.dto.request.LikeRequest;
import com.starterkit.domain.like.dto.response.LikeResponse;
import com.starterkit.domain.like.entity.Like;
import com.starterkit.domain.like.entity.ReactionType;
import com.starterkit.domain.like.repository.LikeRepository;
import com.starterkit.domain.notification.service.NotificationService;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeService {

    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final CheckinRepository checkinRepository;
    private final NotificationService notificationService;

    /**
     * 리액션 토글 (upsert).
     * - 동일 reactionType으로 다시 클릭 → 취소 (삭제)
     * - 다른 reactionType으로 클릭 → 교체 (삭제 후 재저장)
     * - 기존 Like 없음 → 새로 생성
     */
    @Transactional
    public LikeResponse toggleReaction(Long checkinId, LikeRequest request, UserDetails userDetails) {
        Checkin checkin = checkinRepository.findById(checkinId)
                .orElseThrow(() -> new ResourceNotFoundException("체크인을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        ReactionType incoming = request.resolvedReactionType();
        Optional<Like> existing = likeRepository.findByUserIdAndCheckinId(user.getId(), checkinId);

        boolean liked;
        ReactionType resultReactionType;

        if (existing.isPresent()) {
            likeRepository.deleteByUserIdAndCheckinId(user.getId(), checkinId);
            likeRepository.flush();

            if (existing.get().getReactionType() == incoming) {
                // 같은 타입 재클릭 → 취소
                liked = false;
                resultReactionType = null;
            } else {
                // 다른 타입 → 교체
                likeRepository.save(Like.builder()
                        .user(user)
                        .checkin(checkin)
                        .reactionType(incoming)
                        .build());
                liked = true;
                resultReactionType = incoming;
            }
        } else {
            likeRepository.save(Like.builder()
                    .user(user)
                    .checkin(checkin)
                    .reactionType(incoming)
                    .build());
            liked = true;
            resultReactionType = incoming;
        }

        if (liked && !checkin.getUser().getId().equals(user.getId())) {
            String msg = user.getNickname() + "님이 활동에 공감했어요";
            notificationService.sendPush(checkin.getUser().getId(), "나도 했어요!", msg);
            notificationService.sendInApp(
                    checkin.getUser().getId(),
                    user.getNickname(),
                    com.starterkit.domain.notification.entity.NotificationType.LIKE,
                    checkinId,
                    msg
            );
        }

        Map<String, Long> reactionCounts = buildReactionCounts(checkinId);
        return new LikeResponse(liked, resultReactionType, reactionCounts);
    }

    // ---- 하위 호환용 메서드 (기존 addLike / removeLike 대체) ----

    @Transactional
    public void addLike(Long checkinId, UserDetails userDetails) {
        toggleReaction(checkinId, new LikeRequest(ReactionType.LIKE), userDetails);
    }

    @Transactional
    public void removeLike(Long checkinId, UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        if (likeRepository.existsByUserIdAndCheckinId(user.getId(), checkinId)) {
            likeRepository.deleteByUserIdAndCheckinId(user.getId(), checkinId);
        }
    }

    private Map<String, Long> buildReactionCounts(Long checkinId) {
        List<Object[]> rows = likeRepository.countByReactionTypeForCheckin(checkinId);
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            ReactionType rt = (ReactionType) row[0];
            Long cnt = (Long) row[1];
            counts.put(rt.name(), cnt);
        }
        return counts;
    }
}
