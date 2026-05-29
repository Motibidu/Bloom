package com.starterkit.domain.prompt.dto.response;

import com.starterkit.domain.prompt.entity.FamilyPrompt;
import com.starterkit.domain.prompt.entity.PromptDirection;
import com.starterkit.domain.prompt.entity.PromptTemplate;

import java.time.LocalDateTime;

public record ReceivedPromptResponse(
        Long id,
        Long senderId,
        String senderNickname,
        PromptDirection direction,
        PromptTemplate templateCode,
        String templateLabel,
        LocalDateTime sentAt
) {
    public static ReceivedPromptResponse of(FamilyPrompt prompt, String senderNickname) {
        return new ReceivedPromptResponse(
                prompt.getId(),
                prompt.getSenderId(),
                senderNickname,
                prompt.getDirection(),
                prompt.getTemplateCode(),
                prompt.getTemplateCode().getLabel(),
                prompt.getSentAt()
        );
    }
}
