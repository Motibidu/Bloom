import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CheckIn } from '@/types'

export interface FamilyFeedResponse {
  groupId: number
  groupName: string
  checkins: CheckIn[]
}

export type FamilyMemberRole = 'OWNER' | 'GUEST'

export interface FamilyMember {
  userId: number
  nickname: string
  profileImageUrl: string | null
  role: FamilyMemberRole
}

export interface FamilyGroup {
  id: number
  name: string
  inviteCode: string
  members: FamilyMember[]
  memberCount: number
}

export interface FamilyGroupSummary {
  groupId: number
  name: string
  memberCount: number
}

export interface CreateFamilyRequest {
  name: string
}

export interface JoinFamilyRequest {
  inviteCode: string
}

export function useMyFamily() {
  return useQuery<FamilyGroup>({
    queryKey: ['family', 'my'],
    queryFn: () => api.get<FamilyGroup>('/families/my').then(r => r.data),
    retry: false, // 404(그룹 없음)는 재시도 불필요
  })
}

export function useCreateFamily() {
  const queryClient = useQueryClient()
  return useMutation<FamilyGroup, Error, CreateFamilyRequest>({
    mutationFn: (data) =>
      api.post<FamilyGroup>('/families', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'my'] })
    },
  })
}

export function useJoinFamily() {
  const queryClient = useQueryClient()
  return useMutation<FamilyGroupSummary, Error, JoinFamilyRequest>({
    mutationFn: (data) =>
      api.post<FamilyGroupSummary>('/families/join', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'my'] })
    },
  })
}

export function useLeaveFamilyGroup() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: (groupId) =>
      api.delete(`/families/${groupId}/members/me`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] })
    },
  })
}

export function useFamilyFeed(groupId: number | undefined) {
  return useQuery<FamilyFeedResponse>({
    queryKey: ['family', 'feed', groupId],
    queryFn: () => api.get<FamilyFeedResponse>(`/families/${groupId}/feed`).then(r => r.data),
    enabled: !!groupId,
  })
}

/** 현재 사용자가 가족 그룹에서 GUEST인지 여부 */
export function useIsGuestMember(): boolean {
  const { data: family } = useMyFamily()
  const currentUserId = useCurrentUserId()
  if (!family || currentUserId == null) return false
  const me = family.members.find(m => m.userId === currentUserId)
  return me?.role === 'GUEST'
}

function useCurrentUserId(): number | null {
  const raw = localStorage.getItem('auth-storage')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed?.state?.user?.id ?? null
  } catch {
    return null
  }
}
