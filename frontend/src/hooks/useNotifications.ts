import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface AppNotification {
  id: number
  actorNickname: string
  type: 'LIKE' | 'COMMENT' | 'PROMPT'
  checkinId: number | null
  message: string
  isRead: boolean
  createdAt: string
}

export function useNotifications(enabled = true) {
  return useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<AppNotification[]>('/notifications').then((r) => r.data),
    staleTime: 30_000,
    enabled,
  })
}

export function useUnreadCount(enabled = true) {
  return useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
    staleTime: 0,
    refetchInterval: enabled ? 60_000 : false,
    enabled,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
