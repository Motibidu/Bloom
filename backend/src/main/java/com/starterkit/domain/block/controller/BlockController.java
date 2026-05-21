package com.starterkit.domain.block.controller;

import com.starterkit.domain.block.dto.response.BlockedUserResponse;
import com.starterkit.domain.block.service.BlockService;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blocks")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;
    private final UserRepository userRepository;

    @Value("${app.s3.bucket}")
    private String s3Bucket;

    @Value("${app.s3.region}")
    private String s3Region;

    private String s3BaseUrl() {
        return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com";
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Void> block(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User me = findCurrentUser(userDetails);
        blockService.block(me.getId(), userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> unblock(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User me = findCurrentUser(userDetails);
        blockService.unblock(me.getId(), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<BlockedUserResponse>> getBlockedUsers(
            @AuthenticationPrincipal UserDetails userDetails) {
        User me = findCurrentUser(userDetails);
        return ResponseEntity.ok(blockService.getBlockedUsers(me.getId(), s3BaseUrl()));
    }

    private User findCurrentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }
}
