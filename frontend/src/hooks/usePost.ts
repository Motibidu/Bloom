import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export type PostCategoryValue = 'FREE' | 'QNA' | 'INFO'

export interface PostSummary {
  id: number
  category: PostCategoryValue
  title: string
  contentPreview: string
  thumbnailUrl: string | null
  userId: number
  nickname: string
  createdAt: string
  commentCount: number
}

export interface PostComment {
  id: number
  userId: number
  nickname: string
  content: string
  createdAt: string
  commentType: 'TEXT' | 'PRAISE_CARD'
  praiseCardType: string | null
  parentId: number | null
  replies: PostComment[]
}

export interface PostDetail {
  id: number
  userId: number
  nickname: string
  profileImageUrl: string | null
  category: PostCategoryValue
  title: string
  content: string
  photoUrls: string[]
  likeCount: number
  myReactionType: string | null
  reactionCounts: Record<string, number>
  commentCount: number
  viewCount: number
  createdAt: string
}

export interface PostPage {
  posts: PostSummary[]
  currentPage: number
  totalPages: number
  totalElements: number
}

export function usePostList(category: PostCategoryValue | null, page: number) {
  return useQuery<PostPage>({
    queryKey: ['posts', category ?? 'all', page],
    queryFn: () =>
      api.get('/posts', { params: { category: category ?? undefined, page } }).then(r => r.data),
  })
}

export function usePostDetail(id: number) {
  return useQuery<PostDetail>({
    queryKey: ['posts', id],
    queryFn: () => api.get(`/posts/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function usePostPhotoUploadUrl() {
  return useMutation({
    mutationFn: (data: { filename: string; contentType: string }) =>
      api.post<{ uploadUrl: string; objectKey: string; expiresIn: number }>(
        '/posts/photo-upload-url', data
      ).then(r => r.data),
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { category: string; title: string; content: string; photoObjectKeys?: string[] }) =>
      api.post<PostDetail>('/posts', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useDeletePost(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function usePostComments(postId: number) {
  return useQuery<PostComment[]>({
    queryKey: ['postComments', postId],
    queryFn: () => api.get(`/posts/${postId}/comments`).then(r => r.data),
    enabled: !!postId,
  })
}

export function useCreatePostComment(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { content?: string; commentType: 'TEXT'; parentId?: number | null }) =>
      api.post(`/posts/${postId}/comments`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts', postId] })
      // 목록 캐시(['posts', category, page])도 무효화해 댓글 수가 목록에 즉시 반영되도록 함
      queryClient.invalidateQueries({
        predicate: q => q.queryKey[0] === 'posts' && typeof q.queryKey[1] === 'string',
      })
    },
  })
}

export function usePostLikeToggle(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reactionType }: { reactionType?: string }) =>
      api.post(`/posts/${postId}/likes`, reactionType ? { reactionType } : {}).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId] })
    },
  })
}
