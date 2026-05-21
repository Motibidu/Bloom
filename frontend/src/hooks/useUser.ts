import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types/user'
import { useAuthStore } from '@/store/authStore'

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<User>('/users/me').then((r) => r.data),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (data: { nickname: string; bio?: string; profileImageObjectKey?: string }) =>
      api.patch<User>('/users/me', data).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
      setUser(updated)
    },
  })
}

export function useProfileImageUrl() {
  return useMutation({
    mutationFn: () =>
      api.post<{ uploadUrl: string; objectKey: string; expiresIn: number }>(
        '/users/me/profile-image-url'
      ).then((r) => r.data),
  })
}
