import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// 오늘의 피드
export function useTodayFeed() {
  return useQuery({
    queryKey: ['checkins', 'today'],
    queryFn: () => api.get('/checkins/today').then(r => r.data),
  })
}

// 사진 업로드 URL 발급
export function usePhotoUploadUrl() {
  return useMutation({
    mutationFn: (data: { filename: string; contentType: string }) =>
      api.post<{ uploadUrl: string; objectKey: string; expiresIn: number }>(
        '/checkins/photo-upload-url', data
      ).then(r => r.data),
  })
}

// 체크인 생성 (JSON)
export function useCreateCheckin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { category: string; title: string; content: string; photoObjectKeys?: string[] }) =>
      api.post('/checkins', {
        category: data.category,
        title: data.title,
        description: data.content,
        photoObjectKeys: data.photoObjectKeys,
      }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
    },
  })
}

// 체크인 삭제
export function useDeleteCheckin(checkinId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/checkins/${checkinId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
    },
  })
}

// 체크인 상세
export function useCheckinDetail(id: number) {
  return useQuery({
    queryKey: ['checkins', id],
    queryFn: () => api.get(`/checkins/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

// 좋아요 토글 (옵티미스틱 업데이트)
export function useLikeToggle(checkinId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ liked }: { liked: boolean }) =>
      liked
        ? api.delete(`/checkins/${checkinId}/likes`)
        : api.post(`/checkins/${checkinId}/likes`),
    onMutate: async ({ liked }) => {
      await queryClient.cancelQueries({ queryKey: ['checkins', checkinId] })
      await queryClient.cancelQueries({ queryKey: ['checkins', 'today'] })

      const prevDetail = queryClient.getQueryData(['checkins', checkinId])
      const prevFeed = queryClient.getQueryData(['checkins', 'today'])

      const updater = (old: any) => ({
        ...old,
        likedByMe: !liked,
        likeCount: liked ? old.likeCount - 1 : old.likeCount + 1,
      })

      queryClient.setQueryData(['checkins', checkinId], (old: any) => old ? updater(old) : old)
      queryClient.setQueryData(['checkins', 'today'], (old: any) => {
        if (!old?.checkins) return old
        return {
          ...old,
          checkins: old.checkins.map((c: any) => c.id === checkinId ? updater(c) : c),
        }
      })

      return { prevDetail, prevFeed }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prevDetail) queryClient.setQueryData(['checkins', checkinId], context.prevDetail)
      if (context?.prevFeed) queryClient.setQueryData(['checkins', 'today'], context.prevFeed)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', checkinId] })
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
    },
  })
}
