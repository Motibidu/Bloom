package com.starterkit.domain.report.repository;

import com.starterkit.domain.report.entity.Report;
import com.starterkit.domain.report.entity.ReportTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterIdAndTargetTypeAndTargetId(Long reporterId, ReportTargetType targetType, Long targetId);
}
