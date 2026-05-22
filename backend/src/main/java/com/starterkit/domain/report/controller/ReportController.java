package com.starterkit.domain.report.controller;

import com.starterkit.domain.report.dto.request.CreateReportRequest;
import com.starterkit.domain.report.service.ReportService;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Void> createReport(
            @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        reportService.createReport(user.getId(), request);
        return ResponseEntity.noContent().build();
    }
}
