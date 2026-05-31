package com.starterkit.domain.prompt.dto.response;

import com.starterkit.domain.prompt.entity.FamilyPrompt;
import com.starterkit.domain.prompt.entity.PromptTemplate;

import java.time.LocalDateTime;

public record ReceivedPromptResponse(
        Long id,
        Long senderId,
        String senderNickname,
        PromptTemplate templateCode,
        String templateLabel,
        LocalDateTime sentAt
) {
    public static ReceivedPromptResponse of(FamilyPrompt prompt, String senderNickname) {
        return new ReceivedPromptResponse(
                prompt.getId(),
                prompt.getSenderId(),
                senderNickname,
                prompt.getTemplateCode(),
                prompt.getTemplateCode().getLabel(),
                prompt.getSentAt()
        );
    }
}
