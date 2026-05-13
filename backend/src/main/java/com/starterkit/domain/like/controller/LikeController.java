package com.starterkit.domain.like.controller;

import com.starterkit.domain.like.dto.request.LikeRequest;
import com.starterkit.domain.like.dto.response.LikeResponse;
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
@Tag(name = "Likes", description = "리액션(좋아요) 관련 API")
@SecurityRequirement(name = "bearerAuth")
public class LikeController {

    private final LikeService likeService;

    /**
     * 리액션 토글 엔드포인트.
     * body: { "reactionType": "LIKE" | "HEART" | "CHEER" | "AMAZING" | "RELATE" }
     * reactionType 생략 시 기본값 LIKE.
     * 동일 타입 재전송 → 취소. 다른 타입 전송 → 교체.
     */
    @PostMapping("/{id}/likes")
    @Operation(summary = "리액션 토글 (추가/교체/취소)")
    public ResponseEntity<LikeResponse> toggleReaction(
            @PathVariable("id") Long id,
            @RequestBody(required = false) LikeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        LikeRequest req = request != null ? request : new LikeRequest(null);
        LikeResponse response = likeService.toggleReaction(id, req, userDetails);
        return ResponseEntity.ok(response);
    }

    /**
     * 하위 호환용 DELETE 엔드포인트 (기존 FE 코드와 호환 유지).
     * 신규 FE에서는 POST 토글 방식을 사용 권장.
     */
    @DeleteMapping("/{id}/likes")
    @Operation(summary = "좋아요 취소 (레거시)")
    public ResponseEntity<Void> removeLike(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        likeService.removeLike(id, userDetails);
        return ResponseEntity.ok().build();
    }
}
