package com.starterkit.domain.board.controller;

import com.starterkit.domain.board.dto.request.CreatePostRequest;
import com.starterkit.domain.board.dto.response.PostPageResponse;
import com.starterkit.domain.board.dto.response.PostResponse;
import com.starterkit.domain.board.entity.PostCategory;
import com.starterkit.domain.board.service.PostService;
import com.starterkit.domain.checkin.dto.request.PhotoUploadUrlRequest;
import com.starterkit.domain.checkin.dto.response.PhotoUploadUrlResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "Posts", description = "게시판 관련 API")
@SecurityRequirement(name = "bearerAuth")
public class PostController {

    private final PostService postService;

    @PostMapping
    @Operation(summary = "게시글 작성")
    public ResponseEntity<PostResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreatePostRequest request) {
        return ResponseEntity.ok(postService.create(userDetails.getUsername(), request));
    }

    @GetMapping
    @Operation(summary = "게시글 목록 조회 (카테고리 필터 + 페이지네이션)")
    public ResponseEntity<PostPageResponse> getList(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) PostCategory category,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(postService.getList(category, page, userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "게시글 상세 조회")
    public ResponseEntity<PostResponse> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(postService.getById(userDetails.getUsername(), id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "게시글 삭제")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id) {
        postService.delete(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photo-upload-url")
    @Operation(summary = "게시글 사진 업로드 Presigned URL 발급")
    public ResponseEntity<PhotoUploadUrlResponse> getPhotoUploadUrl(
            @Valid @RequestBody PhotoUploadUrlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.generatePhotoUploadUrl(request, userDetails));
    }
}
