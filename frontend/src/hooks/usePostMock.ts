import { useState, useEffect, useCallback } from 'react'

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
  parentId: number | null
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
  createdAt: string
}

export interface PostPage {
  posts: PostSummary[]
  currentPage: number
  totalPages: number
  totalElements: number
}

let mockIdSeq = 1000
const mockComments = new Map<number, PostComment[]>()

const seedPosts: PostDetail[] = [
  {
    id: 1, userId: 1, nickname: '김영희', profileImageUrl: null,
    category: 'FREE', title: '오늘 날씨가 정말 좋네요',
    content: '아침에 산책하는데 날씨가 너무 좋아서 기분이 좋았어요. 다들 오늘 하루 어떻게 보내고 계신가요?',
    photoUrls: [], likeCount: 3, myReactionType: null, reactionCounts: { LIKE: 3 }, commentCount: 2,
    createdAt: '2026-07-27T09:00:00',
  },
  {
    id: 2, userId: 2, nickname: '박철수', profileImageUrl: null,
    category: 'QNA', title: '무릎 통증에 좋은 운동 있을까요?',
    content: '요즘 무릎이 좀 아픈데, 비슷한 경험 있으신 분들 어떤 운동으로 관리하시는지 궁금합니다.',
    photoUrls: [], likeCount: 5, myReactionType: 'HEART', reactionCounts: { LIKE: 2, HEART: 3 }, commentCount: 4,
    createdAt: '2026-07-27T11:30:00',
  },
  {
    id: 3, userId: 3, nickname: '이순자', profileImageUrl: null,
    category: 'INFO', title: '동네 무료 건강검진 안내',
    content: '이번 달 말까지 보건소에서 무료 건강검진 하니 꼭 신청하세요. 예약은 전화로 가능합니다.',
    photoUrls: [], likeCount: 8, myReactionType: null, reactionCounts: { LIKE: 8 }, commentCount: 1,
    createdAt: '2026-07-26T14:00:00',
  },
]

const mockPosts: PostDetail[] = [...seedPosts]

function toSummary(p: PostDetail): PostSummary {
  return {
    id: p.id,
    category: p.category,
    title: p.title,
    contentPreview: p.content.length > 60 ? p.content.slice(0, 60) : p.content,
    thumbnailUrl: p.photoUrls[0] ?? null,
    userId: p.userId,
    nickname: p.nickname,
    createdAt: p.createdAt,
    commentCount: p.commentCount,
  }
}

export function usePostList(category: PostCategoryValue | null, page: number) {
  const [data, setData] = useState<PostPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const filtered = category ? mockPosts.filter(p => p.category === category) : mockPosts
    const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const pageSize = 10
    const start = page * pageSize
    const pageItems = sorted.slice(start, start + pageSize).map(toSummary)
    setData({
      posts: pageItems,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
      totalElements: sorted.length,
    })
    setIsLoading(false)
  }, [category, page])

  return { data, isLoading }
}

export function usePostDetail(id: number) {
  const [data, setData] = useState<PostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const found = mockPosts.find(p => p.id === id) ?? null
    setData(found)
    setIsLoading(false)
  }, [id])

  return { data, isLoading }
}

export function useCreatePost() {
  const mutateAsync = useCallback(async (input: {
    category: PostCategoryValue
    title: string
    content: string
    photoObjectKeys?: string[]
  }) => {
    const newPost: PostDetail = {
      id: ++mockIdSeq,
      userId: 1,
      nickname: '나',
      profileImageUrl: null,
      category: input.category,
      title: input.title,
      content: input.content,
      photoUrls: input.photoObjectKeys ?? [],
      likeCount: 0,
      myReactionType: null,
      reactionCounts: {},
      commentCount: 0,
      createdAt: new Date().toISOString(),
    }
    mockPosts.unshift(newPost)
    return newPost
  }, [])

  return { mutateAsync }
}

export function useDeletePost(id: number) {
  const mutateAsync = useCallback(async () => {
    const idx = mockPosts.findIndex(p => p.id === id)
    if (idx >= 0) mockPosts.splice(idx, 1)
  }, [id])

  return { mutateAsync }
}

export function usePostComments(postId: number) {
  const [data, setData] = useState<PostComment[]>([])

  useEffect(() => {
    setData(mockComments.get(postId) ?? [])
  }, [postId])

  return { data }
}

export function useCreatePostComment(postId: number) {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback((
    input: { content: string; commentType: 'TEXT'; parentId?: number | null },
    opts?: { onSuccess?: () => void }
  ) => {
    setIsPending(true)
    const list = mockComments.get(postId) ?? []
    const newComment: PostComment = {
      id: ++mockIdSeq,
      userId: 1,
      nickname: '나',
      content: input.content,
      createdAt: new Date().toISOString(),
      parentId: input.parentId ?? null,
    }
    mockComments.set(postId, [...list, newComment])
    const post = mockPosts.find(p => p.id === postId)
    if (post) post.commentCount += 1
    setIsPending(false)
    opts?.onSuccess?.()
  }, [postId])

  return { mutate, isPending }
}

export function usePostLikeToggle(postId: number) {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(({ reactionType }: { reactionType?: string }) => {
    setIsPending(true)
    const post = mockPosts.find(p => p.id === postId)
    if (post) {
      const prev = post.myReactionType
      if (prev && post.reactionCounts[prev]) {
        post.reactionCounts[prev] = Math.max(0, post.reactionCounts[prev] - 1)
      }
      if (prev === reactionType) {
        post.myReactionType = null
      } else if (reactionType) {
        post.myReactionType = reactionType
        post.reactionCounts[reactionType] = (post.reactionCounts[reactionType] ?? 0) + 1
      }
      post.likeCount = Object.values(post.reactionCounts).reduce((a, b) => a + b, 0)
    }
    setIsPending(false)
  }, [postId])

  return { mutate, isPending }
}
