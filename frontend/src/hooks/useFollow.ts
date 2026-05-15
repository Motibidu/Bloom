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

export function useFollowingList() {
  return useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () =>
      api.get<UserSearchResult[]>('/follows/following').then(r => r.data),
  })
}

export function useFollowersList() {
  return useQuery({
    queryKey: ['follows', 'followers'],
    queryFn: () =>
      api.get<UserSearchResult[]>('/follows/followers').then(r => r.data),
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
      queryClient.invalidateQueries({ queryKey: ['follows'] })
      queryClient.invalidateQueries({ queryKey: ['feed', 'following'] })
    },
  })
}
