package com.starterkit.domain.follow.service;

import com.starterkit.domain.follow.entity.Follow;
import com.starterkit.domain.follow.repository.FollowRepository;
import com.starterkit.domain.notification.service.NotificationService;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.domain.user.dto.response.UserSearchResponse;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public void follow(Long targetUserId, UserDetails userDetails) {
        User follower = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        User following = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("대상 사용자를 찾을 수 없습니다."));

        if (follower.getId().equals(following.getId())) return;
        if (followRepository.existsByFollowerIdAndFollowingId(follower.getId(), following.getId())) return;

        followRepository.save(Follow.builder()
                .follower(follower)
                .following(following)
                .build());

        notificationService.sendPush(
                following.getId(),
                "새 팔로워",
                follower.getNickname() + "님이 팔로우했어요"
        );
    }

    @Transactional
    public void unfollow(Long targetUserId, UserDetails userDetails) {
        User follower = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        followRepository.findByFollowerIdAndFollowingId(follower.getId(), targetUserId)
                .ifPresent(followRepository::delete);
    }

    public List<UserSearchResponse> searchUsers(String nickname, UserDetails userDetails) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        return userRepository.findByNicknameContainingIgnoreCase(nickname).stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .map(u -> UserSearchResponse.of(
                        u,
                        followRepository.countByFollowingId(u.getId()),
                        followRepository.countByFollowerId(u.getId()),
                        followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), u.getId())
                ))
                .toList();
    }

    public List<Long> getFollowingIds(UserDetails userDetails) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        return followRepository.findByFollowerId(currentUser.getId()).stream()
                .map(f -> f.getFollowing().getId())
                .toList();
    }

    public List<UserSearchResponse> getFollowingList(UserDetails userDetails) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        return followRepository.findByFollowerIdWithFollowing(currentUser.getId()).stream()
                .map(f -> {
                    User target = f.getFollowing();
                    return UserSearchResponse.of(
                            target,
                            followRepository.countByFollowingId(target.getId()),
                            followRepository.countByFollowerId(target.getId()),
                            true
                    );
                })
                .toList();
    }

    public List<UserSearchResponse> getFollowersList(UserDetails userDetails) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        return followRepository.findByFollowingIdWithFollower(currentUser.getId()).stream()
                .map(f -> {
                    User target = f.getFollower();
                    return UserSearchResponse.of(
                            target,
                            followRepository.countByFollowingId(target.getId()),
                            followRepository.countByFollowerId(target.getId()),
                            followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), target.getId())
                    );
                })
                .toList();
    }
}
