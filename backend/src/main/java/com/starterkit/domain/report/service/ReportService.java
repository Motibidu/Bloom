package com.starterkit.domain.report.service;

import com.starterkit.domain.report.dto.request.CreateReportRequest;
import com.starterkit.domain.report.entity.Report;
import com.starterkit.domain.report.repository.ReportRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createReport(Long reporterId, CreateReportRequest req) {
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(reporterId, req.targetType(), req.targetId())) {
            throw new IllegalStateException("이미 신고한 대상입니다.");
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(req.targetType())
                .targetId(req.targetId())
                .reason(req.reason())
                .build();

        reportRepository.save(report);
    }
}
