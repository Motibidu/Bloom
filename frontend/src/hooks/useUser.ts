import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types/user'

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<User>('/users/me').then((r) => r.data),
  })
}
