import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useBlockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => api.post(`/blocks/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
    },
  })
}

export function useUnblockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => api.delete(`/blocks/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
    },
  })
}
