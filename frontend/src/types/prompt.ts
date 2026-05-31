export type PromptTemplate =
  | 'SHARE_MEAL'
  | 'SHARE_WALK'
  | 'SHARE_HOBBY'
  | 'SHARE_HEALTH'
  | 'SHARE_TODAY'

export interface PromptTemplateItem {
  code: PromptTemplate
  label: string
  description: string
}

export interface SendPromptRequest {
  recipientId: number
  templateCode: PromptTemplate
}

export interface SendPromptResponse {
  id: number
  warning: boolean
  weeklyCount: number
}

export interface ReceivedPrompt {
  id: number
  senderId: number
  senderNickname: string
  templateCode: PromptTemplate
  templateLabel: string
  sentAt: string
}

export const PROMPT_TEMPLATES: PromptTemplateItem[] = [
  {
    code: 'SHARE_MEAL',
    label: '오늘 뭐 드셨어요?',
    description: '오늘 식사를 함께 나눠요',
  },
  {
    code: 'SHARE_WALK',
    label: '오늘 산책하셨어요?',
    description: '오늘 산책 기록을 공유해요',
  },
  {
    code: 'SHARE_HOBBY',
    label: '오늘 취미 활동 하셨어요?',
    description: '오늘 취미 활동을 나눠요',
  },
  {
    code: 'SHARE_HEALTH',
    label: '오늘 건강은 어떠세요?',
    description: '오늘 건강 상태를 알려주세요',
  },
  {
    code: 'SHARE_TODAY',
    label: '오늘 하루 어떠셨어요?',
    description: '오늘 하루를 함께 나눠요',
  },
]
