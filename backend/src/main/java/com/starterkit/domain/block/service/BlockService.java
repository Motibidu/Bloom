package com.starterkit.domain.block.service;

import com.starterkit.domain.block.dto.response.BlockedUserResponse;
import com.starterkit.domain.block.entity.Block;
import com.starterkit.domain.block.repository.BlockRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BlockService {

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    @Transactional
    public void block(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException("자신을 차단할 수 없습니다.");
        }
        if (blockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            // 이미 차단 중 — 무시
            return;
        }
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new ResourceNotFoundException("차단 대상 사용자를 찾을 수 없습니다."));

        blockRepository.save(Block.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build());
    }

    @Transactional
    public void unblock(Long blockerId, Long blockedId) {
        blockRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    public List<Long> getBlockedUserIds(Long blockerId) {
        return blockRepository.findBlockedUserIdsByBlockerId(blockerId);
    }

    public List<BlockedUserResponse> getBlockedUsers(Long blockerId, String s3BaseUrl) {
        return blockRepository.findByBlockerIdWithBlocked(blockerId).stream()
                .map(b -> {
                    User blocked = b.getBlocked();
                    String profileImageUrl = blocked.getProfileImageObjectKey() != null
                            ? s3BaseUrl + "/" + blocked.getProfileImageObjectKey()
                            : null;
                    return new BlockedUserResponse(blocked.getId(), blocked.getNickname(), profileImageUrl);
                })
                .toList();
    }
}
