package com.starterkit.domain.prompt.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PromptTemplate {
    SHARE_MEAL("오늘 뭐 드셨어요?"),
    SHARE_WALK("오늘 산책하셨어요?"),
    SHARE_HOBBY("오늘 취미 활동 하셨어요?"),
    SHARE_HEALTH("오늘 건강은 어떠세요?"),
    SHARE_TODAY("오늘 하루 어떠셨어요?");

    private final String label;
}
