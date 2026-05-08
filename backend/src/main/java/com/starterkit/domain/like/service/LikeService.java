package com.starterkit.domain.like.service;

import com.starterkit.domain.checkin.entity.Checkin;
import com.starterkit.domain.checkin.repository.CheckinRepository;
import com.starterkit.domain.like.entity.Like;
import com.starterkit.domain.like.repository.LikeRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeService {

    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final CheckinRepository checkinRepository;

    @Transactional
    public void addLike(Long checkinId, UserDetails userDetails) {
        Checkin checkin = checkinRepository.findById(checkinId)
                .orElseThrow(() -> new ResourceNotFoundException("체크인을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        if (likeRepository.existsByUserIdAndCheckinId(user.getId(), checkin.getId())) {
            return;
        }

        likeRepository.save(Like.builder()
                .user(user)
                .checkin(checkin)
                .build());
    }

    @Transactional
    public void removeLike(Long checkinId, UserDetails userDetails) {
        checkinRepository.findById(checkinId)
                .orElseThrow(() -> new ResourceNotFoundException("체크인을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        if (likeRepository.existsByUserIdAndCheckinId(user.getId(), checkinId)) {
            likeRepository.deleteByUserIdAndCheckinId(user.getId(), checkinId);
        }
    }
}
