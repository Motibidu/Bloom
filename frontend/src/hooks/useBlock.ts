import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface BlockedUser {
  userId: number
  nickname: string
  profileImageUrl: string | null
}

export function useBlockedUsers() {
  return useQuery<BlockedUser[]>({
    queryKey: ['blocks'],
    queryFn: () => api.get<BlockedUser[]>('/blocks').then(r => r.data),
  })
}

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
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
    },
  })
}
