import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { UserSearchResult } from '@/types'

export function useSearchUsers(nickname: string) {
  return useQuery({
    queryKey: ['users', 'search', nickname],
    queryFn: () =>
      api.get<UserSearchResult[]>('/users/search', { params: { nickname } }).then(r => r.data),
    enabled: nickname.trim().length >= 1,
  })
}

export function useFollowToggle(targetUserId: number, isFollowing: boolean) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      isFollowing
        ? api.delete(`/users/${targetUserId}/follow`)
        : api.post(`/users/${targetUserId}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] })
      queryClient.invalidateQueries({ queryKey: ['feed', 'following'] })
    },
  })
}
