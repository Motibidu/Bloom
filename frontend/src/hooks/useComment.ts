import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useComments(checkinId: number) {
  return useQuery({
    queryKey: ['comments', checkinId],
    queryFn: () => api.get(`/checkins/${checkinId}/comments`).then(r => r.data),
    enabled: !!checkinId,
  })
}

export function useCreateComment(checkinId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api.post(`/checkins/${checkinId}/comments`, { content }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', checkinId] })
      queryClient.invalidateQueries({ queryKey: ['checkins', checkinId] })
    },
  })
}
