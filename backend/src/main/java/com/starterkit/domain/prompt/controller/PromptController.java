package com.starterkit.domain.prompt.controller;

import com.starterkit.domain.prompt.dto.request.RespondPromptRequest;
import com.starterkit.domain.prompt.dto.request.SendPromptRequest;
import com.starterkit.domain.prompt.dto.response.ReceivedPromptResponse;
import com.starterkit.domain.prompt.dto.response.SendPromptResponse;
import com.starterkit.domain.prompt.service.PromptService;
import com.starterkit.domain.user.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prompts")
@RequiredArgsConstructor
@Tag(name = "Prompts", description = "가족 프롬프트 API")
@SecurityRequirement(name = "bearerAuth")
public class PromptController {

    private final PromptService promptService;

    @PostMapping
    @Operation(summary = "프롬프트 발송")
    public ResponseEntity<SendPromptResponse> sendPrompt(
            @Valid @RequestBody SendPromptRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        return ResponseEntity.ok(promptService.sendPrompt(userId, request));
    }

    @GetMapping("/templates")
    @Operation(summary = "프롬프트 템플릿 목록 조회")
    public ResponseEntity<List<Map<String, String>>> getTemplates() {
        return ResponseEntity.ok(promptService.getTemplates());
    }

    @GetMapping("/received")
    @Operation(summary = "수신된 프롬프트 목록 조회 (PENDING)")
    public ResponseEntity<List<ReceivedPromptResponse>> getReceivedPrompts(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        return ResponseEntity.ok(promptService.getReceivedPrompts(userId));
    }

    @PostMapping("/{id}/respond")
    @Operation(summary = "프롬프트에 기록으로 응답")
    public ResponseEntity<Void> respondToPrompt(
            @PathVariable Long id,
            @Valid @RequestBody RespondPromptRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = ((User) userDetails).getId();
        promptService.respondToPrompt(id, request, userId);
        return ResponseEntity.ok().build();
    }
}
