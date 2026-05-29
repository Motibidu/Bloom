import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { SendPromptRequest, SendPromptResponse, ReceivedPrompt } from '@/types/prompt'

export function usePromptTemplates() {
  return useQuery({
    queryKey: ['prompts', 'templates'],
    queryFn: () => api.get<{ code: string; label: string }[]>('/prompts/templates').then(r => r.data),
    staleTime: Infinity,
  })
}

export function useReceivedPrompts(enabled = true) {
  return useQuery<ReceivedPrompt[]>({
    queryKey: ['prompts', 'received'],
    queryFn: () => api.get<ReceivedPrompt[]>('/prompts/received').then(r => r.data),
    staleTime: 30_000,
    enabled,
  })
}

export function useSendPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: SendPromptRequest) =>
      api.post<SendPromptResponse>('/prompts', req).then(r => r.data),
    onSuccess: (data) => {
      if (data.warning) {
        toast.warning(`이번 주 ${data.weeklyCount}번째 초대예요. 적당히 보내는 게 좋아요 😊`)
      } else {
        toast.success('공유 초대를 보냈어요!')
      }
      queryClient.invalidateQueries({ queryKey: ['prompts', 'received'] })
    },
    onError: () => {
      toast.error('초대 발송에 실패했어요. 다시 시도해 주세요.')
    },
  })
}

export function useRespondPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ promptId, checkinId }: { promptId: number; checkinId: number }) =>
      api.post(`/prompts/${promptId}/respond`, { checkinId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', 'received'] })
    },
  })
}
