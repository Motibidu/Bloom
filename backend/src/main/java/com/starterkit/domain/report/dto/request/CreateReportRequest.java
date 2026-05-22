package com.starterkit.domain.report.dto.request;

import com.starterkit.domain.report.entity.ReasonType;
import com.starterkit.domain.report.entity.ReportTargetType;

public record CreateReportRequest(
        ReportTargetType targetType,
        Long targetId,
        ReasonType reason
) {}
