import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface TodayFeedPage {
  checkins: any[]
  sameCategoryUserCount: number
  activitySummary: any[]
  totalCheckinCount: number
  nextCursor: number | null
  hasMore: boolean
}

// 무한스크롤 피드 (커서 기반 페이지네이션)
export function useInfiniteTodayFeed(feedType: 'all' | 'following' = 'all') {
  return useInfiniteQuery<TodayFeedPage>({
    queryKey: ['checkins', 'today', feedType, 'infinite'],
    queryFn: ({ pageParam }) =>
      api.get<TodayFeedPage>('/checkins/today', {
        params: {
          feedType,
          cursor: pageParam ?? undefined,
          limit: 20,
        },
      }).then(r => r.data),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  })
}

// 오늘의 피드 (기존 단일 페이지 — 하위 호환용)
export function useTodayFeed(feedType: 'all' | 'following' = 'all') {
  return useQuery({
    queryKey: ['checkins', 'today', feedType],
    queryFn: () =>
      api.get('/checkins/today', { params: { feedType } }).then(r => r.data),
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
    mutationFn: (data: { category: string; title: string; content: string; photoObjectKeys?: string[]; isSimple?: boolean }) =>
      api.post('/checkins', {
        category: data.category,
        title: data.title,
        description: data.content,
        photoObjectKeys: data.photoObjectKeys,
        isSimple: data.isSimple ?? false,
      }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
      queryClient.invalidateQueries({ queryKey: ['family', 'feed'] })
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

// 체크인 수정
export function useUpdateCheckin(checkinId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { category: string; title?: string; description: string }) =>
      api.patch(`/checkins/${checkinId}`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
      queryClient.invalidateQueries({ queryKey: ['checkins', checkinId] })
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

// 같은 카테고리 활동 사용자 목록 (클릭 시 수동 fetch)
export function useSameCategoryUsers() {
  return useQuery({
    queryKey: ['checkins', 'same-category-users'],
    queryFn: () => api.get('/checkins/today/same-category-users').then(r => r.data),
    enabled: false,
  })
}

// 리액션 토글 (옵티미스틱 업데이트)
// reactionType: undefined 이면 기존 리액션 취소, 값이 있으면 해당 리액션 등록
export function useLikeToggle(checkinId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reactionType }: { reactionType?: string }) =>
      api.post(`/checkins/${checkinId}/likes`, reactionType ? { reactionType } : {}).then(r => r.data),
    onMutate: async ({ reactionType }) => {
      await queryClient.cancelQueries({ queryKey: ['checkins', checkinId] })
      // infinite query 키 패턴 취소
      await queryClient.cancelQueries({ queryKey: ['checkins', 'today'] })

      const prevDetail = queryClient.getQueryData(['checkins', checkinId])

      // infinite query 캐시 백업 (all / following 두 가지 feedType)
      const prevFeedAll = queryClient.getQueryData(['checkins', 'today', 'all', 'infinite'])
      const prevFeedFollowing = queryClient.getQueryData(['checkins', 'today', 'following', 'infinite'])

      const updater = (old: any) => {
        const prevReaction = old.myReactionType as string | null
        const isTogglingOff = prevReaction === reactionType
        const newReaction = isTogglingOff ? null : (reactionType ?? null)

        // reactionCounts 낙관적 업데이트
        const prevCounts: Record<string, number> = old.reactionCounts ?? {}
        const newCounts = { ...prevCounts }
        if (prevReaction && newCounts[prevReaction]) {
          newCounts[prevReaction] = Math.max(0, (newCounts[prevReaction] ?? 0) - 1)
          if (newCounts[prevReaction] === 0) delete newCounts[prevReaction]
        }
        if (newReaction) {
          newCounts[newReaction] = (newCounts[newReaction] ?? 0) + 1
        }

        const totalLikes = Object.values(newCounts).reduce((a, b) => a + b, 0)

        return {
          ...old,
          myReactionType: newReaction,
          reactionCounts: newCounts,
          likedByMe: !!newReaction,
          likeCount: totalLikes,
        }
      }

      // 상세 페이지 낙관적 업데이트
      queryClient.setQueryData(['checkins', checkinId], (old: any) => old ? updater(old) : old)

      // infinite query 캐시 낙관적 업데이트 (pages 배열 구조)
      const infiniteUpdater = (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: TodayFeedPage) => ({
            ...page,
            checkins: page.checkins.map((c: any) =>
              c.id === checkinId ? updater(c) : c
            ),
          })),
        }
      }
      queryClient.setQueryData(['checkins', 'today', 'all', 'infinite'], infiniteUpdater)
      queryClient.setQueryData(['checkins', 'today', 'following', 'infinite'], infiniteUpdater)

      return { prevDetail, prevFeedAll, prevFeedFollowing }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prevDetail) queryClient.setQueryData(['checkins', checkinId], context.prevDetail)
      if (context?.prevFeedAll) queryClient.setQueryData(['checkins', 'today', 'all', 'infinite'], context.prevFeedAll)
      if (context?.prevFeedFollowing) queryClient.setQueryData(['checkins', 'today', 'following', 'infinite'], context.prevFeedFollowing)
    },
    onSettled: () => {
      // 상세 페이지는 invalidate 하지 않음 — GET /checkins/{id}가 viewCount를 증가시키기 때문
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today'] })
    },
  })
}
