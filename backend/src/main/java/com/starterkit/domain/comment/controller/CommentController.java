package com.starterkit.domain.comment.controller;

import com.starterkit.domain.comment.dto.request.CreateCommentRequest;
import com.starterkit.domain.comment.dto.response.CommentResponse;
import com.starterkit.domain.comment.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "댓글 관련 API")
@SecurityRequirement(name = "bearerAuth")
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/{id}/comments")
    @Operation(summary = "댓글 목록 조회")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(commentService.getComments(id, userDetails));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "댓글 작성")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(id, req, userDetails));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    @Operation(summary = "댓글 삭제")
    public ResponseEntity<Void> deleteComment(
            @PathVariable("id") Long id,
            @PathVariable("commentId") Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(commentId, userDetails);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/comments/{commentId}")
    @Operation(summary = "댓글 수정")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable("id") Long id,
            @PathVariable("commentId") Long commentId,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(commentService.updateComment(commentId, body.get("content"), userDetails));
    }
}
