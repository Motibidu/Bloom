import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CheckIn } from '@/types'

export interface FamilyMember {
  userId: number
  nickname: string
  profileImageUrl: string | null
}

export interface FamilyGroup {
  groupId: number
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

export function useFamilyFeed(groupId: number | undefined) {
  return useQuery<CheckIn[]>({
    queryKey: ['family', 'feed', groupId],
    queryFn: () => api.get<CheckIn[]>(`/families/${groupId}/feed`).then(r => r.data),
    enabled: !!groupId,
  })
}
