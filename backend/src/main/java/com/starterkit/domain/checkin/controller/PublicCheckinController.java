package com.starterkit.domain.checkin.controller;

import com.starterkit.domain.checkin.dto.response.CheckinResponse;
import com.starterkit.domain.checkin.service.CheckinService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/checkins")
@RequiredArgsConstructor
@Tag(name = "Public Checkins", description = "인증 없이 접근 가능한 체크인 공개 API")
public class PublicCheckinController {

    private final CheckinService checkinService;

    @GetMapping("/{id}")
    @Operation(summary = "체크인 공개 단건 조회 (공유 링크용)")
    public ResponseEntity<CheckinResponse> getPublicById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(checkinService.getPublicById(id));
    }
}
