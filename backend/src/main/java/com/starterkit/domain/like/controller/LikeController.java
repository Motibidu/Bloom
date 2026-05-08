package com.starterkit.domain.like.controller;

import com.starterkit.domain.like.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
@Tag(name = "Likes", description = "좋아요 관련 API")
@SecurityRequirement(name = "bearerAuth")
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/{id}/likes")
    @Operation(summary = "좋아요 추가")
    public ResponseEntity<Void> addLike(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        likeService.addLike(id, userDetails);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/likes")
    @Operation(summary = "좋아요 취소")
    public ResponseEntity<Void> removeLike(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        likeService.removeLike(id, userDetails);
        return ResponseEntity.ok().build();
    }
}
