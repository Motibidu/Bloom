# 게시판 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하단 5번째 탭 "게시판"을 신설하여 자유게시판/질문공간/정보공유 3개 고정 카테고리의 글쓰기·목록(페이지네이션)·상세·댓글(대댓글 포함)·5종 반응·신고·차단·카카오톡/밴드 공유 기능을 제공한다.

**Architecture:** 2단계로 진행한다.

- **Phase 1 (Task A~E) — 프론트 골격**: 목업 데이터로 하단 탭·목록·작성·상세 화면을 먼저 완성해 화면 흐름과 디자인을 확인한다. 실제 API 대신 로컬 상수 배열과 로컬 state로 동작하는 `usePostMock.ts`를 사용한다.
- **Phase 2 (Task 1~8) — 백엔드**: 신규 `board` 도메인(Post/PostCategory/PostPhoto)을 checkin 도메인과 동일 패턴으로 만들고, 댓글·반응은 기존 `Comment`/`Like` 엔티티에 `post` 연관관계를 nullable로 추가해 재사용한다(checkin 전용 기존 Service/Controller/Repository는 건드리지 않고 board 전용 메서드로 확장).
- **Phase 3 (Task F) — 연결**: Phase 1의 목업 훅(`usePostMock.ts`)을 Phase 2에서 만든 실제 API를 호출하는 `usePost.ts`로 교체하고, Phase 1 화면들의 import를 갈아끼운다.

**Tech Stack:** Spring Boot 3.4 / Java 21 / Spring Data JPA / MySQL / React 19 / TypeScript / TanStack Query / React Router v7

## Global Constraints

- 작성 권한: `MEMBER`만 (FAMILY_VIEWER는 열람만) — `docs/superpowers/specs/2026-07-28-board-design.md` 준수
- 목록: 카테고리 pill 필터(전체/자유게시판/질문공간/정보공유) + 10개/페이지 페이지네이션(무한스크롤 아님)
- 목록 행: 제목 + 본문 1줄 미리보기 + 작성자·날짜·댓글수(좌) / 정사각 썸네일(우, 사진 있을 때만)
- 작성 포맷: 제목 + 본문 + 사진 최대 3장(기존 checkin과 동일), 칭찬카드 없음
- 반응 5종, 댓글+대댓글, 카카오톡/밴드 공유, 신고, 차단 — 모두 기존 기능 재사용
- 컬러 상수·폰트·버튼/카드/입력 스타일은 `frontend/src/CLAUDE.md` 디자인 시스템 그대로 준수 (임의 Tailwind 컬러 유틸리티 금지)
- `comments`/`likes` 테이블에 추가하는 `post_id` 컬럼은 nullable, 기존 `checkin_id`도 nullable로 완화 — 기존 데이터에 영향 없이 배포되어야 함
- 이 저장소는 Flyway 마이그레이션 폴더(`backend/src/main/resources/db/migration/`)를 상시 유지하지 않고 배포 시점에 파일을 추가했다가 반영 후 제거하는 방식으로 운영된다(과거 hotfix 커밋 `9637752` 참고). `ddl-auto: validate` + `schema.sql` 조합이므로, 로컬 개발 시에는 **로컬 MySQL(`bloom_dev`)에 직접 ALTER TABLE을 실행**하고 `db/schema.sql`도 함께 갱신해야 애플리케이션이 정상 기동한다.

---

## File Structure

### 프론트 신규 — Phase 1 (목업)

```
frontend/src/hooks/usePostMock.ts               (Phase 3에서 usePost.ts로 대체됨)
frontend/src/pages/BoardListPage.tsx
frontend/src/pages/BoardWritePage.tsx
frontend/src/pages/BoardDetailPage.tsx
frontend/src/components/ui/domain/board/post-list-row.tsx
frontend/src/components/ui/domain/board/post-category-tabs.tsx
frontend/src/components/ui/domain/board/pagination.tsx
```

### 프론트 수정 — Phase 1

```
frontend/src/components/layout/BottomTabBar.tsx  (게시판 탭 추가)
frontend/src/App.tsx                             (라우트 추가)
```

### 백엔드 신규 — Phase 2

```
backend/src/main/java/com/starterkit/domain/board/
  entity/Post.java
  entity/PostCategory.java
  entity/PostPhoto.java
  dto/request/CreatePostRequest.java
  dto/response/PostResponse.java
  dto/response/PostSummaryResponse.java
  dto/response/PostPageResponse.java
  repository/PostRepository.java
  repository/PostPhotoRepository.java
  service/PostService.java
  controller/PostController.java
  exception/PostNotFoundException.java
```

### 백엔드 수정 — Phase 2

```
backend/src/main/resources/db/schema.sql                                  (posts, post_photos 테이블 추가, comments/likes에 post_id 컬럼 추가)
backend/src/main/java/com/starterkit/domain/comment/entity/Comment.java   (checkin nullable, post 연관관계 추가)
backend/src/main/java/com/starterkit/domain/comment/repository/CommentRepository.java  (post 대상 쿼리 추가)
backend/src/main/java/com/starterkit/domain/comment/service/CommentService.java        (post 대상 분기 메서드 추가)
backend/src/main/java/com/starterkit/domain/like/entity/Like.java         (checkin nullable, post 연관관계 추가)
backend/src/main/java/com/starterkit/domain/like/repository/LikeRepository.java        (post 대상 쿼리 추가)
backend/src/main/java/com/starterkit/domain/like/service/LikeService.java              (post 대상 분기 메서드 추가)
backend/src/main/java/com/starterkit/domain/report/entity/ReportTargetType.java        (POST 추가)
backend/src/main/java/com/starterkit/global/config/SecurityConfig.java    (/api/posts/** 인가 규칙 추가)
```

### 프론트 신규/수정 — Phase 3 (연결)

```
frontend/src/hooks/usePost.ts        (신규, 실제 API 훅)
frontend/src/hooks/useReport.ts      (수정, POST 타입 추가)
frontend/src/pages/BoardListPage.tsx, BoardWritePage.tsx, BoardDetailPage.tsx (수정, import를 usePostMock → usePost로 교체)
```

---

# Phase 1 — 프론트 골격 (목업 데이터)

## Task A: 목업 데이터 훅 (usePostMock)

**Files:**
- Create: `frontend/src/hooks/usePostMock.ts`

**Interfaces:**
- Produces: `PostSummary`, `PostDetail`, `PostComment` 타입. `usePostList(category, page): { data, isLoading }`, `usePostDetail(id): { data, isLoading }`, `useCreatePost(): { mutateAsync }`, `useDeletePost(id): { mutateAsync }`, `usePostComments(postId): { data }`, `useCreatePostComment(postId): { mutate, isPending }`, `usePostLikeToggle(postId): { mutate, isPending }`. Phase 3에서 `usePost.ts`가 동일한 함수 시그니처로 이 파일을 대체한다 — 화면 코드는 import 경로만 바뀌도록 인터페이스를 맞춘다.

이 훅은 실제 네트워크 호출 없이 모듈 스코프의 배열(`mockPosts`)을 조작해 React state처럼 동작한다. 새로고침하면 초기 시드 데이터로 리셋된다(목업이므로 영속성 불필요).

- [ ] **Step 1: 타입 및 시드 데이터 작성**

```typescript
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
```

- [ ] **Step 2: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/usePostMock.ts
git commit -m "✨ feat: 게시판 목업 데이터 훅 추가"
```

---

## Task B: 게시판 목록 페이지 (목업 연동)

**Files:**
- Create: `frontend/src/components/ui/domain/board/post-category-tabs.tsx`
- Create: `frontend/src/components/ui/domain/board/post-list-row.tsx`
- Create: `frontend/src/components/ui/domain/board/pagination.tsx`
- Create: `frontend/src/pages/BoardListPage.tsx`

**Interfaces:**
- Consumes: `usePostList` (Task A, `@/hooks/usePostMock`), 디자인 상수(`frontend/src/CLAUDE.md`)
- Produces: `<PostCategoryTabs value={category} onChange={...} />`, `<PostListRow post={PostSummary} onClick={...} />`, `<Pagination currentPage totalPages onPageChange />`, `BoardListPage` 컴포넌트 (`/board` 라우트)

- [ ] **Step 1: PostCategoryTabs 컴포넌트 작성**

```tsx
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad = `linear-gradient(135deg, ${main}, ${light})`

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  QNA: '질문공간',
  INFO: '정보공유',
}

interface Props {
  value: string | null
  onChange: (value: string | null) => void
}

export default function PostCategoryTabs({ value, onChange }: Props) {
  const options: (string | null)[] = [null, 'FREE', 'QNA', 'INFO']
  return (
    <div
      className="flex gap-1.5 p-1 rounded-2xl overflow-x-auto"
      style={{ background: mA(0.07) }}
      role="tablist"
      aria-label="게시판 카테고리"
    >
      {options.map(opt => {
        const selected = value === opt
        return (
          <button
            key={opt ?? 'all'}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt)}
            className="inline-flex items-center min-h-[44px] px-4 rounded-xl text-base font-bold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={selected
              ? { background: grad, color: 'white', '--tw-ring-color': main } as React.CSSProperties
              : { color: dark, '--tw-ring-color': main } as React.CSSProperties}
          >
            {opt === null ? '전체' : CATEGORY_LABELS[opt]}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: PostListRow 컴포넌트 작성**

```tsx
import type { PostSummary } from '@/hooks/usePostMock'

const dark = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

function formatRelativeDate(createdAt: string): string {
  const date = new Date(createdAt)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`
}

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  QNA: '질문공간',
  INFO: '정보공유',
}

interface Props {
  post: PostSummary
  onClick: () => void
}

export default function PostListRow({ post, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 text-left rounded-2xl bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ boxShadow: `0 2px 12px ${mA(0.08)}`, '--tw-ring-color': dark } as React.CSSProperties}
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-sm font-bold shrink-0"
            style={{ background: mA(0.10), border: `1px solid ${mA(0.22)}`, color: dark }}
          >
            {CATEGORY_LABELS[post.category]}
          </span>
          <h3 className="text-lg font-black text-foreground truncate leading-snug">
            {post.title}
          </h3>
        </div>
        <p className="text-base text-foreground/60 truncate">{post.contentPreview}</p>
        <div className="flex items-center gap-2 text-sm text-foreground/50 font-medium">
          <span>{post.nickname}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt}>{formatRelativeDate(post.createdAt)}</time>
          <span aria-hidden="true">·</span>
          <span>댓글 {post.commentCount}</span>
        </div>
      </div>
      {post.thumbnailUrl && (
        <img
          src={post.thumbnailUrl}
          alt=""
          aria-hidden="true"
          width={72}
          height={72}
          className="rounded-xl object-cover shrink-0"
          style={{ width: 72, height: 72 }}
          loading="lazy"
        />
      )}
    </button>
  )
}
```

- [ ] **Step 3: Pagination 컴포넌트 작성**

```tsx
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i)

  return (
    <nav aria-label="게시글 페이지 이동" className="flex items-center justify-center gap-1.5 pt-4 flex-wrap">
      {pages.map(p => {
        const selected = p === currentPage
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={selected ? 'page' : undefined}
            aria-label={`${p + 1}페이지`}
            className="min-w-[44px] min-h-[44px] rounded-xl text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={selected
              ? { background: main, color: 'white' }
              : { background: mA(0.06), color: dark }}
          >
            {p + 1}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 4: BoardListPage 작성**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { usePostList, type PostCategoryValue } from '@/hooks/usePostMock'
import PostCategoryTabs from '@/components/ui/domain/board/post-category-tabs'
import PostListRow from '@/components/ui/domain/board/post-list-row'
import Pagination from '@/components/ui/domain/board/pagination'
import { useAuthStore } from '@/store/authStore'

const main = 'oklch(0.62 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const grad = `linear-gradient(135deg, ${main}, ${light})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

export default function BoardListPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [category, setCategory] = useState<PostCategoryValue | null>(null)
  const [page, setPage] = useState(0)

  const { data, isLoading } = usePostList(category, page)

  const handleCategoryChange = (next: string | null) => {
    setCategory(next as PostCategoryValue | null)
    setPage(0)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground" style={serifStyle}>게시판</h1>
        {user?.canWriteFeed && (
          <button
            type="button"
            onClick={() => navigate('/board/write')}
            className="inline-flex items-center gap-1.5 min-h-[48px] px-5 rounded-2xl text-base font-black text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: grad }}
          >
            <PenLine size={18} aria-hidden="true" />
            글쓰기
          </button>
        )}
      </div>

      <PostCategoryTabs value={category} onChange={handleCategoryChange} />

      {isLoading ? (
        <p role="status" aria-live="polite" className="text-center py-12 text-base text-foreground/50">
          불러오는 중이에요...
        </p>
      ) : data && data.posts.length > 0 ? (
        <div className="space-y-3">
          {data.posts.map(post => (
            <PostListRow key={post.id} post={post} onClick={() => navigate(`/board/${post.id}`)} />
          ))}
        </div>
      ) : (
        <p className="text-center py-12 text-base text-foreground/50">아직 게시글이 없어요</p>
      )}

      {data && (
        <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </main>
  )
}
```

`useAuthStore`의 `user.canWriteFeed` 필드가 실제로 존재하는지 `frontend/src/store/authStore.ts`를 Read해서 확인한다 (`App.tsx`의 `AuthInitializer`에서 이미 `user.canWriteFeed`를 사용 중이므로 존재할 가능성이 높다).

- [ ] **Step 5: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/domain/board frontend/src/pages/BoardListPage.tsx
git commit -m "✨ feat: 게시판 목록 페이지 구현 (목업)"
```

---

## Task C: 게시글 작성 페이지 (목업 연동)

**Files:**
- Create: `frontend/src/pages/BoardWritePage.tsx`

**Interfaces:**
- Consumes: `useCreatePost` (Task A, `@/hooks/usePostMock`)
- Produces: `BoardWritePage` 컴포넌트 (`/board/write` 라우트)

- [ ] **Step 1: BoardWritePage 작성**

`frontend/src/pages/CheckinWritePage.tsx`의 상세 모드 UI(제목/본문/사진 첨부 섹션, 스타일)를 참고하되 카테고리 선택을 게시판 카테고리 3종 선택 UI로 교체한다. 목업 단계에서는 사진을 실제로 S3에 업로드하지 않고 `FileReader`로 생성한 data URL 미리보기 문자열을 그대로 `photoObjectKeys`로 흘려보낸다(Phase 3에서 실제 presigned URL 업로드 로직으로 교체됨).

```tsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { useCreatePost, type PostCategoryValue } from '@/hooks/usePostMock'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

const CATEGORY_OPTIONS: { value: PostCategoryValue; label: string }[] = [
  { value: 'FREE', label: '자유게시판' },
  { value: 'QNA', label: '질문공간' },
  { value: 'INFO', label: '정보공유' },
]

export default function BoardWritePage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<PostCategoryValue | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createPost = useCreatePost()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return
    const remaining = 3 - photoPreviews.length
    const toAdd = selected.slice(0, remaining)
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!category || !title.trim() || !content.trim()) return
    setIsSubmitting(true)
    try {
      const newPost = await createPost.mutateAsync({
        category,
        title: title.trim(),
        content: content.trim(),
        photoObjectKeys: photoPreviews.length > 0 ? photoPreviews : undefined,
      })
      toast.success('게시글을 등록했어요 🎉')
      navigate(`/board/${newPost.id}`)
    } catch {
      toast.error('등록에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = !!category && !!title.trim() && !!content.trim() && !isSubmitting

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="이전 페이지로 돌아가기"
          className="inline-flex items-center gap-1.5 min-h-[48px] px-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: dark, '--tw-ring-color': main } as React.CSSProperties}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-base font-bold">돌아가기</span>
        </button>
      </div>

      <div className="rounded-2xl bg-card px-6 py-7 space-y-7" style={{ border: `2px solid ${mA(0.20)}` }}>
        <h1 className="text-xl font-black text-foreground leading-snug" style={serifStyle}>
          게시글 작성하기
        </h1>

        <section aria-labelledby="category-label" className="space-y-3">
          <p id="category-label" className="text-lg font-bold text-foreground">
            게시판 선택 <span className="text-base font-medium text-muted-foreground">(필수)</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map(opt => {
              const selected = category === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  aria-pressed={selected}
                  className="min-h-[56px] rounded-2xl px-3 py-3 text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={selected
                    ? { background: grad, color: 'white' }
                    : { background: mA(0.06), color: dark, border: `1px solid ${mA(0.15)}` }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="title-label" className="space-y-2">
          <div className="flex justify-between items-center">
            <label id="title-label" htmlFor="write-title" className="text-lg font-bold text-foreground">
              제목 <span className="text-base font-medium text-muted-foreground">(필수)</span>
            </label>
            <span className="text-base font-medium text-foreground/50" aria-live="polite">{title.length}/50</span>
          </div>
          <Input
            id="write-title"
            className="h-14 text-lg px-4 rounded-xl border-2 focus-visible:ring-0"
            style={title.length > 0 ? { borderColor: mA(0.45) } : undefined}
            maxLength={50}
            placeholder="제목을 입력해 주세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoComplete="off"
          />
        </section>

        <section aria-labelledby="content-label" className="space-y-2">
          <div className="flex justify-between items-center">
            <label id="content-label" htmlFor="write-content" className="text-lg font-bold text-foreground">
              내용 <span className="text-base font-medium text-muted-foreground">(필수)</span>
            </label>
            <span className="text-base font-medium text-foreground/50" aria-live="polite">{content.length}/2000</span>
          </div>
          <Textarea
            id="write-content"
            className="text-lg px-4 py-3 resize-none rounded-xl border-2 focus-visible:ring-0"
            style={content.length > 0 ? { borderColor: mA(0.45) } : undefined}
            rows={8}
            maxLength={2000}
            placeholder="내용을 자유롭게 적어보세요"
            value={content}
            onChange={e => setContent(e.target.value)}
            autoComplete="off"
          />
        </section>

        <section aria-labelledby="photo-label" className="space-y-3">
          <p id="photo-label" className="text-lg font-bold text-foreground">
            사진 첨부 <span className="text-base font-medium text-muted-foreground">(선택, 최대 3장)</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />
          <div className="grid grid-cols-3 gap-3">
            {photoPreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden" style={{ border: `2px solid ${mA(0.15)}` }}>
                <img src={src} alt={`첨부 사진 ${i + 1} 미리보기`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`${i + 1}번째 사진 제거`}
                  className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ background: 'oklch(0 0 0 / 0.65)' }}
                >
                  <X size={15} className="text-white" aria-hidden="true" />
                </button>
              </div>
            ))}
            {photoPreviews.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="사진 추가하기"
                className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: mA(0.22), '--tw-ring-color': main } as React.CSSProperties}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: mA(0.10) }} aria-hidden="true">
                  <ImagePlus size={20} style={{ color: main }} />
                </div>
                <span className="text-sm font-bold" style={{ color: mA(0.6) }}>{photoPreviews.length}/3</span>
              </button>
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          className="w-full h-16 text-xl font-black text-white rounded-2xl transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: grad, '--tw-ring-color': main } as React.CSSProperties}
        >
          {isSubmitting ? '등록하는 중이에요...' : '등록하기'}
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/BoardWritePage.tsx
git commit -m "✨ feat: 게시글 작성 페이지 구현 (목업)"
```

---

## Task D: 게시글 상세 페이지 (목업 연동, 댓글/반응 UI)

**Files:**
- Create: `frontend/src/pages/BoardDetailPage.tsx`

**Interfaces:**
- Consumes: `usePostDetail`, `usePostComments`, `useCreatePostComment`, `usePostLikeToggle`, `useDeletePost` (Task A, `@/hooks/usePostMock`)
- Produces: `BoardDetailPage` 컴포넌트 (`/board/:id` 라우트)

**참고**: 신고·차단·카카오톡/밴드 공유는 Phase 1(목업)에서는 다루지 않는다 — 실제 사용자/차단 API와 얽혀 있어 화면 골격 검증에는 불필요하다. Phase 3(연결)에서 `useCreateReport`/`useBlockUser`/공유 유틸을 붙인다.

- [ ] **Step 1: ReactionPicker 재사용 가능 여부 확인**

`frontend/src/components/ui/domain/checkin/reaction-picker.tsx`를 Read한다. `myReactionType`/`reactionCounts`/`onReact` 콜백만 받는 프레젠테이션 컴포넌트인지 확인한다(`checkin-card.tsx`에서 `onReact={(reactionType) => likeToggle.mutate({ reactionType })}` 형태로 넘기는 것으로 보아 프레젠테이션 컴포넌트로 추정됨). 프레젠테이션 컴포넌트라면 그대로 재사용, 내부에서 자체적으로 `useLikeToggle(checkinId)`를 호출하는 구조라면 게시판에서는 사용하지 않고 이 페이지 안에 간단한 반응 버튼 UI를 직접 만든다.

- [ ] **Step 2: BoardDetailPage 작성**

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  usePostDetail,
  usePostComments,
  useCreatePostComment,
  usePostLikeToggle,
  useDeletePost,
} from '@/hooks/usePostMock'
import { useAuthStore } from '@/store/authStore'
import ReactionPicker from '@/components/ui/domain/checkin/reaction-picker'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  QNA: '질문공간',
  INFO: '정보공유',
}

export default function BoardDetailPage() {
  const { id } = useParams()
  const postId = Number(id)
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.user)

  const { data: post, isLoading } = usePostDetail(postId)
  const { data: comments } = usePostComments(postId)
  const createComment = useCreatePostComment(postId)
  const likeToggle = usePostLikeToggle(postId)
  const deletePost = useDeletePost(postId)

  const [commentText, setCommentText] = useState('')

  if (isLoading || !post) {
    return <p role="status" aria-live="polite" className="text-center py-16 text-base text-foreground/50">불러오는 중이에요...</p>
  }

  const isOwner = currentUser?.id === post.userId

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return
    createComment.mutate(
      { content: commentText.trim(), commentType: 'TEXT' },
      { onSuccess: () => setCommentText('') }
    )
  }

  const handleDelete = async () => {
    await deletePost.mutateAsync()
    toast.success('게시글을 삭제했어요.')
    navigate('/board')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="이전 페이지로 돌아가기"
          className="inline-flex items-center gap-1.5 min-h-[48px] px-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: dark, '--tw-ring-color': main } as React.CSSProperties}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-base font-bold">돌아가기</span>
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label="게시글 삭제"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-base font-bold text-destructive focus-visible:outline-none focus-visible:ring-2"
          >
            <Trash2 size={18} aria-hidden="true" />
            삭제
          </button>
        )}
      </div>

      <article className="rounded-2xl bg-white px-6 py-7 space-y-4" style={{ boxShadow: `0 2px 16px ${mA(0.08)}` }}>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-sm font-bold" style={{ background: mA(0.10), border: `1px solid ${mA(0.22)}`, color: dark }}>
            {CATEGORY_LABELS[post.category]}
          </span>
          <span className="text-sm text-foreground/50 font-medium">{post.nickname}</span>
        </div>
        <h1 className="text-2xl font-black text-foreground leading-snug" style={serifStyle}>{post.title}</h1>
        <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.photoUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {post.photoUrls.map((url, i) => (
              <img key={i} src={url} alt={`첨부 사진 ${i + 1}`} className="w-full rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2" style={{ borderTop: `1px solid ${mA(0.10)}` }}>
          <ReactionPicker
            checkinId={postId}
            myReactionType={post.myReactionType}
            reactionCounts={post.reactionCounts}
            onReact={(reactionType: string) => likeToggle.mutate({ reactionType })}
            disabled={likeToggle.isPending}
          />
          <div className="flex items-center gap-1 min-h-[44px]" style={{ color: 'oklch(0.55 0.05 220)' }}>
            <MessageCircle size={20} aria-hidden="true" />
            <span className="text-sm font-bold">{post.commentCount}</span>
          </div>
        </div>
      </article>

      <section aria-labelledby="comments-label" className="space-y-4">
        <h2 id="comments-label" className="text-lg font-black text-foreground">댓글 {comments.length}개</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="댓글을 입력해 주세요"
            className="flex-1 h-14 text-base px-4 rounded-xl border-2 focus-visible:ring-0 outline-none"
            style={{ borderColor: mA(0.15) }}
          />
          <button
            type="button"
            onClick={handleCommentSubmit}
            disabled={!commentText.trim() || createComment.isPending}
            className="min-h-[56px] px-6 rounded-2xl text-base font-black text-white disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${main}, oklch(0.76 0.12 220))` }}
          >
            등록
          </button>
        </div>
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="rounded-xl px-4 py-3" style={{ background: mA(0.04) }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-foreground">{c.nickname}</span>
              </div>
              <p className="text-base text-foreground/80">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/BoardDetailPage.tsx
git commit -m "✨ feat: 게시글 상세 페이지 구현 (목업, 댓글/반응)"
```

---

## Task E: 라우팅 및 하단 탭바 연결 + 목업 화면 확인

**Files:**
- Modify: `frontend/src/components/layout/BottomTabBar.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `BoardListPage`, `BoardWritePage`, `BoardDetailPage` (Task B, C, D)

- [ ] **Step 1: BottomTabBar에 게시판 탭 추가**

`frontend/src/components/layout/BottomTabBar.tsx`에서 `import { LayoutList, Users, UserCircle2, Search } from 'lucide-react'`를 `import { LayoutList, Users, UserCircle2, Search, NotebookText } from 'lucide-react'`로 바꾸고, `tabs` 배열의 `'/family'` 탭과 `'/discover'` 탭 사이에 추가:

```tsx
{
  path: '/board',
  label: '게시판',
  ariaLabel: '게시판 보기',
  matchPrefix: true,
  icon: <NotebookText size={26} className="text-muted-foreground" aria-hidden="true" />,
  iconActive: <NotebookText size={26} className="text-white" aria-hidden="true" />,
},
```

- [ ] **Step 2: App.tsx에 라우트 추가**

`frontend/src/App.tsx`에서 import 섹션에 추가:
```tsx
import BoardListPage from '@/pages/BoardListPage'
import BoardWritePage from '@/pages/BoardWritePage'
import BoardDetailPage from '@/pages/BoardDetailPage'
```

`<Route path="discover" element={<DiscoverPage />} />` 위에 추가:
```tsx
<Route path="board" element={<BoardListPage />} />
<Route path="board/write" element={<BoardWritePage />} />
<Route path="board/:id" element={<BoardDetailPage />} />
```

- [ ] **Step 3: 타입 체크 및 빌드**

```bash
cd frontend && npm run build
```
Expected: BUILD SUCCESSFUL, 타입 에러 없음

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/BottomTabBar.tsx frontend/src/App.tsx
git commit -m "✨ feat: 게시판 탭 및 라우트 연결 (Phase 1 완료)"
```

- [ ] **Step 5: 브라우저로 화면 흐름 수동 확인 (Phase 1 검증)**

프론트 개발 서버(`npm run dev`)가 이미 떠 있다면 그대로, 아니면 기동한다. 브라우저에서:
1. 하단 탭바에 "게시판" 탭이 보이는지 확인
2. 게시판 탭 클릭 → 목업 시드 데이터(3개 게시글) 목록 노출 확인, 카테고리 필터 동작 확인
3. "글쓰기" → 카테고리 선택 + 제목/본문/사진 입력 → 등록 → 상세 이동 확인
4. 상세에서 반응 클릭, 댓글 작성 확인
5. 디자인이 `frontend/src/CLAUDE.md`의 컬러 상수·타이포그래피 기준과 일치하는지 육안 확인

여기서 사용자에게 화면을 보여주고 피드백을 받는다 — Phase 2(백엔드)로 넘어가기 전에 화면 디자인/흐름에 대한 수정 요청이 있으면 이 시점에 반영한다.

---

# Phase 2 — 백엔드

## Task 1: DB 스키마 — posts / post_photos 테이블 및 comments/likes 컬럼 추가

**Files:**
- Modify: `backend/src/main/resources/db/schema.sql`
- 실행 대상: 로컬 MySQL `bloom_dev` 데이터베이스

**Interfaces:**
- Produces: `posts`(id, user_id, category, title, content, created_at), `post_photos`(id, post_id, object_key, sort_order) 테이블. `comments.post_id`, `likes.post_id` nullable 컬럼. `comments.checkin_id`, `likes.checkin_id`를 NOT NULL → NULL 허용으로 변경.

- [ ] **Step 1: `schema.sql`에서 comments/likes 테이블 정의 확인**

`backend/src/main/resources/db/schema.sql`을 열어 `comments`, `likes` 테이블의 현재 `CREATE TABLE` 구문을 확인한다 (컬럼명, 제약조건 정확히 파악).

- [ ] **Step 2: `schema.sql`에 posts / post_photos 테이블 추가**

기존 `checkins`, `checkin_photos` 테이블 정의를 참고해 아래 내용을 `schema.sql`에 추가한다:

```sql
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(20) NOT NULL,
    title VARCHAR(50) NOT NULL,
    content VARCHAR(2000) NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_posts_category_created ON posts (category, created_at);
CREATE INDEX idx_posts_created ON posts (created_at);

CREATE TABLE IF NOT EXISTS post_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    object_key VARCHAR(300) NOT NULL,
    sort_order INT NOT NULL,
    CONSTRAINT fk_post_photos_post FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

- [ ] **Step 3: `schema.sql`에서 comments / likes 테이블에 post_id 컬럼 추가, checkin_id nullable로 변경**

`comments` 테이블 정의에서:
```sql
checkin_id BIGINT NOT NULL,
```
를
```sql
checkin_id BIGINT NULL,
post_id BIGINT NULL,
```
로 변경하고 `CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id)`를 추가한다.

`likes` 테이블도 동일하게 `checkin_id BIGINT NULL, post_id BIGINT NULL`로 변경하고 FK를 추가한다. 기존 `UNIQUE KEY (user_id, checkin_id)` 제약이 있다면, `post_id`가 NULL인 행끼리는 MySQL에서 UNIQUE 제약이 NULL을 여러 개 허용하므로 별도 처리 없이 유지 가능함을 확인한다 (다만 게시글 좋아요 유니크는 `(user_id, post_id)`로 별도 유니크 인덱스를 추가한다).

- [ ] **Step 4: 로컬 MySQL에 동일한 DDL 직접 실행**

```bash
mysql -u root -p1234 bloom_dev
```

접속 후 Step 2, Step 3에서 작성한 DDL을 그대로 실행한다 (`CREATE TABLE`, `ALTER TABLE comments MODIFY checkin_id BIGINT NULL, ADD COLUMN post_id BIGINT NULL, ADD CONSTRAINT ...` 등 실제 컬럼 존재 여부에 맞춰 `ALTER TABLE`로 적용).

- [ ] **Step 5: 백엔드 기동 확인**

`.\gradlew.bat bootRun --args='--spring.profiles.active=dev'` 실행 후 `Started StarterKitApplication` 로그로 `ddl-auto: validate`가 통과하는지 확인한다. 실패 시 스키마 불일치를 스택트레이스에서 찾아 수정한다.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/resources/db/schema.sql
git commit -m "🌱 feat: 게시판 DB 스키마 추가 (posts, post_photos, comments/likes post_id)"
```

---

## Task 2: Post 엔티티 및 연관 엔티티

**Files:**
- Create: `backend/src/main/java/com/starterkit/domain/board/entity/PostCategory.java`
- Create: `backend/src/main/java/com/starterkit/domain/board/entity/Post.java`
- Create: `backend/src/main/java/com/starterkit/domain/board/entity/PostPhoto.java`
- Create: `backend/src/main/java/com/starterkit/domain/board/exception/PostNotFoundException.java`
- Test: 없음 (엔티티는 Task 4 서비스 테스트로 검증)

**Interfaces:**
- Produces: `Post` (id, user, category, title, content, photos, createdAt), `PostCategory` enum(FREE, QNA, INFO), `PostPhoto`(id, post, objectKey, sortOrder)

- [ ] **Step 1: PostCategory enum 작성**

```java
package com.starterkit.domain.board.entity;

public enum PostCategory {
    FREE, QNA, INFO
}
```

- [ ] **Step 2: PostPhoto 엔티티 작성**

`backend/src/main/java/com/starterkit/domain/checkin/entity/CheckinPhoto.java`를 참고해 동일 구조로 작성한다:

```java
package com.starterkit.domain.board.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_photos")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "object_key", nullable = false, length = 300)
    private String objectKey;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
```

- [ ] **Step 3: Post 엔티티 작성**

```java
package com.starterkit.domain.board.entity;

import com.starterkit.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_posts_category_created", columnList = "category, created_at"),
    @Index(name = "idx_posts_created", columnList = "created_at")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostCategory category;

    @Column(nullable = false, length = 50)
    private String title;

    @Column(nullable = false, length = 2000)
    private String content;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<PostPhoto> photos = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(java.time.ZoneOffset.UTC);
    }
}
```

- [ ] **Step 4: PostNotFoundException 작성**

`backend/src/main/java/com/starterkit/domain/checkin/exception/CheckinNotFoundException.java`를 참고해 동일 패턴으로 작성한다 (해당 파일을 먼저 Read해서 상위 클래스와 생성자 시그니처를 그대로 따른다).

- [ ] **Step 5: 컴파일 확인**

```bash
cd backend && ./gradlew.bat compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/board/entity backend/src/main/java/com/starterkit/domain/board/exception
git commit -m "✨ feat: 게시판 Post/PostPhoto 엔티티 추가"
```

---

## Task 3: PostRepository, PostPhotoRepository

**Files:**
- Create: `backend/src/main/java/com/starterkit/domain/board/repository/PostRepository.java`
- Create: `backend/src/main/java/com/starterkit/domain/board/repository/PostPhotoRepository.java`

**Interfaces:**
- Consumes: `Post`, `PostCategory` (Task 2)
- Produces: `PostRepository.findByCategoryOrderByCreatedAtDesc(PostCategory, Pageable): Page<Post>`, `PostRepository.findAllByOrderByCreatedAtDesc(Pageable): Page<Post>`, `PostRepository.findByCategoryExcludingUsersOrderByCreatedAtDesc(PostCategory, List<Long>, Pageable): Page<Post>`, `PostRepository.findAllExcludingUsersOrderByCreatedAtDesc(List<Long>, Pageable): Page<Post>`

- [ ] **Step 1: PostRepository 작성**

```java
package com.starterkit.domain.board.repository;

import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByCategoryOrderByCreatedAtDesc(PostCategory category, Pageable pageable);

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.category = :category AND p.user.id NOT IN :excludeUserIds ORDER BY p.createdAt DESC")
    Page<Post> findByCategoryExcludingUsersOrderByCreatedAtDesc(@Param("category") PostCategory category,
                                                                 @Param("excludeUserIds") List<Long> excludeUserIds,
                                                                 Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.user.id NOT IN :excludeUserIds ORDER BY p.createdAt DESC")
    Page<Post> findAllExcludingUsersOrderByCreatedAtDesc(@Param("excludeUserIds") List<Long> excludeUserIds,
                                                          Pageable pageable);
}
```

- [ ] **Step 2: PostPhotoRepository 작성**

```java
package com.starterkit.domain.board.repository;

import com.starterkit.domain.board.entity.PostPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostPhotoRepository extends JpaRepository<PostPhoto, Long> {
}
```

- [ ] **Step 3: 컴파일 확인**

```bash
cd backend && ./gradlew.bat compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/board/repository
git commit -m "✨ feat: PostRepository 추가"
```

---

## Task 4: Comment/Like 엔티티에 post 연관관계 추가

**Files:**
- Modify: `backend/src/main/java/com/starterkit/domain/comment/entity/Comment.java`
- Modify: `backend/src/main/java/com/starterkit/domain/like/entity/Like.java`
- Modify: `backend/src/main/java/com/starterkit/domain/comment/repository/CommentRepository.java`
- Modify: `backend/src/main/java/com/starterkit/domain/like/repository/LikeRepository.java`

**Interfaces:**
- Consumes: `Post` (Task 2)
- Produces: `Comment.getPost(): Post` (nullable), `Like.getPost(): Post` (nullable). `CommentRepository.findRootCommentsByPostId(Long): List<Comment>`, `CommentRepository.deleteByPostId(Long)`, `CommentRepository.countByPostId(Long): long`. `LikeRepository.findByUserIdAndPostId(Long, Long): Optional<Like>`, `LikeRepository.deleteByUserIdAndPostId(Long, Long)`, `LikeRepository.deleteByPostId(Long)`, `LikeRepository.countByReactionTypeForPost(Long): List<Object[]>`, `LikeRepository.countLikesByPostId(Long): long`.

- [ ] **Step 1: Comment 엔티티에 post 필드 추가, checkin nullable로 변경**

`backend/src/main/java/com/starterkit/domain/comment/entity/Comment.java`에서:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "checkin_id", nullable = false)
private Checkin checkin;
```

를

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "checkin_id", nullable = true)
private Checkin checkin;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "post_id", nullable = true)
private com.starterkit.domain.board.entity.Post post;
```

로 교체한다 (import 문에 `com.starterkit.domain.board.entity.Post` 추가, 전체 경로로 써도 되고 import로 정리해도 됨 — 기존 파일의 import 스타일을 따른다).

- [ ] **Step 2: Like 엔티티에 post 필드 추가, checkin nullable로 변경**

`backend/src/main/java/com/starterkit/domain/like/entity/Like.java`에서 동일하게 `checkin` nullable 변경 + `post` 필드 추가. `@Table` 어노테이션의 `uniqueConstraints`는 `(user_id, checkin_id)`만 있던 것을 그대로 두고, `post_id` 유니크는 애플리케이션 레벨(LikeService의 findByUserIdAndPostId 후 저장)로 보장한다 — Task 1에서 이미 별도 유니크 인덱스를 DB에 추가했다면 어노테이션에도 반영한다:

```java
@Table(name = "likes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "checkin_id"}),
    @UniqueConstraint(columnNames = {"user_id", "post_id"})
})
```

- [ ] **Step 3: CommentRepository에 post 대상 쿼리 메서드 추가**

`backend/src/main/java/com/starterkit/domain/comment/repository/CommentRepository.java`에 추가:

```java
@Query("SELECT c FROM Comment c LEFT JOIN FETCH c.replies r WHERE c.post.id = :postId AND c.parent IS NULL ORDER BY c.createdAt DESC")
List<Comment> findRootCommentsByPostId(@Param("postId") Long postId);

@Query("SELECT c FROM Comment c LEFT JOIN FETCH c.replies r WHERE c.post.id = :postId AND c.parent IS NULL AND c.user.id NOT IN :excludeUserIds ORDER BY c.createdAt DESC")
List<Comment> findRootCommentsByPostIdExcludingUsers(@Param("postId") Long postId,
                                                      @Param("excludeUserIds") List<Long> excludeUserIds);

@Modifying
@Query("DELETE FROM Comment c WHERE c.post.id = :postId")
void deleteByPostId(@Param("postId") Long postId);

long countByPostId(Long postId);
```

- [ ] **Step 4: LikeRepository에 post 대상 쿼리 메서드 추가**

`backend/src/main/java/com/starterkit/domain/like/repository/LikeRepository.java`에 추가:

```java
Optional<Like> findByUserIdAndPostId(Long userId, Long postId);

boolean existsByUserIdAndPostId(Long userId, Long postId);

@Modifying
@Transactional
@Query("DELETE FROM Like l WHERE l.user.id = :userId AND l.post.id = :postId")
void deleteByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

@Modifying
@Query("DELETE FROM Like l WHERE l.post.id = :postId")
void deleteByPostId(@Param("postId") Long postId);

@Query("SELECT l.reactionType, COUNT(l) FROM Like l WHERE l.post.id = :postId GROUP BY l.reactionType")
List<Object[]> countByReactionTypeForPost(@Param("postId") Long postId);

long countByPostId(Long postId);
```

- [ ] **Step 5: 컴파일 확인**

```bash
cd backend && ./gradlew.bat compileJava
```
Expected: BUILD SUCCESSFUL. `Checkin checkin` 참조하는 기존 코드(CheckinService 등)가 nullable 변경으로 깨지지 않는지 확인 — nullable 변경은 컬럼 제약만 완화하는 것이라 기존 checkin 전용 코드 경로는 영향 없어야 한다.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/comment backend/src/main/java/com/starterkit/domain/like
git commit -m "✨ feat: Comment/Like에 게시글 연관관계 추가"
```

---

## Task 5: ReportTargetType에 POST 추가

**Files:**
- Modify: `backend/src/main/java/com/starterkit/domain/report/entity/ReportTargetType.java`

**Interfaces:**
- Produces: `ReportTargetType.POST`

- [ ] **Step 1: enum에 POST 추가**

```java
package com.starterkit.domain.report.entity;

public enum ReportTargetType {
    CHECKIN, COMMENT, POST
}
```

기존 `ReportService.createReport`는 `targetType`을 그대로 저장하는 범용 로직이라 추가 수정이 필요 없다 (`backend/src/main/java/com/starterkit/domain/report/service/ReportService.java` 참고 — targetType별 분기 없음).

- [ ] **Step 2: 컴파일 확인**

```bash
cd backend && ./gradlew.bat compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/report/entity/ReportTargetType.java
git commit -m "✨ feat: 신고 대상에 POST 타입 추가"
```

---

## Task 6: PostService — 생성/조회/목록/삭제 + 사진 업로드 URL 발급

**Files:**
- Create: `backend/src/main/java/com/starterkit/domain/board/dto/request/CreatePostRequest.java`
- Create: `backend/src/main/java/com/starterkit/domain/board/dto/response/PostResponse.java`
- Create: `backend/src/main/java/com/starterkit/domain/board/dto/response/PostSummaryResponse.java`
- Create: `backend/src/main/java/com/starterkit/domain/board/dto/response/PostPageResponse.java`
- Create: `backend/src/main/java/com/starterkit/domain/board/service/PostService.java`
- Test: `backend/src/test/java/com/starterkit/domain/board/service/PostServiceTest.java`

**Interfaces:**
- Consumes: `Post`, `PostCategory`, `PostPhoto` (Task 2), `PostRepository` (Task 3), `LikeRepository.countByReactionTypeForPost/countByPostId` (Task 4), `CommentRepository.countByPostId` (Task 4), `User.isAdult50s()`, `S3Client`/`S3Presigner`(checkin PhotoUploadUrl 재사용 패턴)
- Produces: `PostService.create(String email, CreatePostRequest req): PostResponse`, `PostService.getById(String email, Long id): PostResponse`, `PostService.getList(PostCategory category, int page, String email): PostPageResponse`, `PostService.delete(String email, Long id)`, `PostService.generatePhotoUploadUrl(PhotoUploadUrlRequest, UserDetails): PhotoUploadUrlResponse`

- [ ] **Step 1: CreatePostRequest DTO 작성**

`backend/src/main/java/com/starterkit/domain/checkin/dto/request/CreateCheckinRequest.java` 패턴을 따른다:

```java
package com.starterkit.domain.board.dto.request;

import com.starterkit.domain.board.entity.PostCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePostRequest(
        @NotNull PostCategory category,
        @NotBlank @Size(max = 50) String title,
        @NotBlank @Size(max = 2000) String content,
        @Size(max = 3) List<String> photoObjectKeys) {
}
```

- [ ] **Step 2: PostSummaryResponse DTO 작성 (목록용)**

```java
package com.starterkit.domain.board.dto.response;

import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;

import java.time.LocalDateTime;

public record PostSummaryResponse(
        Long id,
        PostCategory category,
        String title,
        String contentPreview,
        String thumbnailUrl,
        Long userId,
        String nickname,
        LocalDateTime createdAt,
        long commentCount) {

    public static PostSummaryResponse of(Post p, long commentCount, String s3BaseUrl) {
        String preview = p.getContent().length() > 60
                ? p.getContent().substring(0, 60)
                : p.getContent();
        String thumbnail = p.getPhotos().isEmpty()
                ? null
                : s3BaseUrl + "/" + p.getPhotos().get(0).getObjectKey();
        return new PostSummaryResponse(
                p.getId(), p.getCategory(), p.getTitle(), preview, thumbnail,
                p.getUser().getId(), p.getUser().getNickname(), p.getCreatedAt(), commentCount);
    }
}
```

- [ ] **Step 3: PostPageResponse DTO 작성**

```java
package com.starterkit.domain.board.dto.response;

import java.util.List;

public record PostPageResponse(
        List<PostSummaryResponse> posts,
        int currentPage,
        int totalPages,
        long totalElements) {
}
```

- [ ] **Step 4: PostResponse DTO 작성 (상세용)**

`backend/src/main/java/com/starterkit/domain/checkin/dto/response/CheckinResponse.java`를 참고한다:

```java
package com.starterkit.domain.board.dto.response;

import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;
import com.starterkit.domain.like.entity.ReactionType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record PostResponse(
        Long id,
        Long userId,
        String nickname,
        String profileImageUrl,
        PostCategory category,
        String title,
        String content,
        List<String> photoUrls,
        long likeCount,
        ReactionType myReactionType,
        Map<String, Long> reactionCounts,
        long commentCount,
        LocalDateTime createdAt) {

    public static PostResponse of(Post p, long likeCount, ReactionType myReactionType,
                                   Map<String, Long> reactionCounts, long commentCount, String s3BaseUrl) {
        List<String> urls = p.getPhotos().stream()
                .map(photo -> s3BaseUrl + "/" + photo.getObjectKey())
                .toList();
        String profileImgUrl = p.getUser().getProfileImageObjectKey() != null
                ? s3BaseUrl + "/" + p.getUser().getProfileImageObjectKey()
                : null;
        return new PostResponse(
                p.getId(), p.getUser().getId(), p.getUser().getNickname(), profileImgUrl,
                p.getCategory(), p.getTitle(), p.getContent(), urls,
                likeCount, myReactionType, reactionCounts != null ? reactionCounts : Map.of(),
                commentCount, p.getCreatedAt());
    }
}
```

- [ ] **Step 5: 실패하는 테스트 작성 — 게시글 생성**

`backend/src/test/java/com/starterkit/domain/board/service/PostServiceTest.java`:

기존 `backend/src/test/java/com/starterkit/domain/checkin/service/CheckinServiceTest.java`가 있다면 먼저 Read해서 Mockito 설정 패턴(어떤 Repository를 mock하는지, `@ExtendWith(MockitoExtension.class)` 사용 여부)을 그대로 따라 작성한다. 없다면 아래 최소 구조로 작성한다:

```java
package com.starterkit.domain.board.service;

import com.starterkit.domain.board.dto.request.CreatePostRequest;
import com.starterkit.domain.board.dto.response.PostResponse;
import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;
import com.starterkit.domain.board.repository.PostRepository;
import com.starterkit.domain.comment.repository.CommentRepository;
import com.starterkit.domain.like.repository.LikeRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.entity.UserRole;
import com.starterkit.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private LikeRepository likeRepository;

    @InjectMocks
    private PostService postService;

    @Test
    void 게시글을_생성하면_카테고리와_제목이_저장된다() {
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .nickname("테스트유저")
                .role(UserRole.MEMBER)
                .birthYear(1970)
                .build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 1L);
            ReflectionTestUtils.setField(p, "createdAt", java.time.LocalDateTime.now());
            return p;
        });

        CreatePostRequest req = new CreatePostRequest(PostCategory.FREE, "제목", "내용", null);
        PostResponse response = postService.create("test@example.com", req);

        assertThat(response.category()).isEqualTo(PostCategory.FREE);
        assertThat(response.title()).isEqualTo("제목");
    }
}
```

`User` 엔티티의 실제 필드(특히 `birthYear` 존재 여부, builder 필드명)는 `backend/src/main/java/com/starterkit/domain/user/entity/User.java`를 먼저 Read해서 정확히 맞춘다.

- [ ] **Step 6: 테스트 실행하여 실패 확인**

```bash
cd backend && ./gradlew.bat test --tests "com.starterkit.domain.board.service.PostServiceTest"
```
Expected: FAIL — `PostService` 클래스가 없어 컴파일 에러

- [ ] **Step 7: PostService 구현 (사진 업로드 URL 발급 포함)**

`backend/src/main/java/com/starterkit/domain/checkin/service/CheckinService.java`의 `generatePhotoUploadUrl` 메서드를 참고해 `objectKey` prefix만 `"posts/" + user.getId() + "/"`로 바꿔 동일 메서드를 포함시킨다:

```java
package com.starterkit.domain.board.service;

import com.starterkit.domain.board.dto.request.CreatePostRequest;
import com.starterkit.domain.board.dto.response.PostPageResponse;
import com.starterkit.domain.board.dto.response.PostResponse;
import com.starterkit.domain.board.dto.response.PostSummaryResponse;
import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;
import com.starterkit.domain.board.entity.PostPhoto;
import com.starterkit.domain.board.exception.PostNotFoundException;
import com.starterkit.domain.board.repository.PostRepository;
import com.starterkit.domain.block.service.BlockService;
import com.starterkit.domain.checkin.dto.request.PhotoUploadUrlRequest;
import com.starterkit.domain.checkin.dto.response.PhotoUploadUrlResponse;
import com.starterkit.domain.comment.repository.CommentRepository;
import com.starterkit.domain.like.entity.ReactionType;
import com.starterkit.domain.like.repository.LikeRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final BlockService blockService;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String s3Bucket;

    @Value("${app.s3.region}")
    private String s3Region;

    private String s3BaseUrl() {
        return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com";
    }

    @Transactional
    public PostResponse create(String email, CreatePostRequest req) {
        User user = findUserByEmail(email);
        if (!user.isAdult50s()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "50대 이상만 게시글을 작성할 수 있습니다.");
        }
        String expectedPrefix = "posts/" + user.getId() + "/";
        if (req.photoObjectKeys() != null) {
            for (String key : req.photoObjectKeys()) {
                if (!key.startsWith(expectedPrefix)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "잘못된 이미지 경로입니다.");
                }
            }
        }
        Post post = Post.builder()
                .user(user)
                .category(req.category())
                .title(req.title())
                .content(req.content())
                .build();
        if (req.photoObjectKeys() != null) {
            for (int i = 0; i < req.photoObjectKeys().size(); i++) {
                post.getPhotos().add(
                        PostPhoto.builder()
                                .post(post)
                                .objectKey(req.photoObjectKeys().get(i))
                                .sortOrder(i)
                                .build());
            }
        }
        postRepository.save(post);
        return PostResponse.of(post, 0, null, Map.of(), 0, s3BaseUrl());
    }

    @Transactional
    public PostResponse getById(String email, Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("게시글을 찾을 수 없습니다."));
        User user = findUserByEmail(email);

        long likeCount = likeRepository.countByPostId(id);
        long commentCount = commentRepository.countByPostId(id);

        Map<String, Long> reactionCounts = buildReactionCountMap(likeRepository.countByReactionTypeForPost(id));
        ReactionType myReactionType = likeRepository.findByUserIdAndPostId(user.getId(), id)
                .map(com.starterkit.domain.like.entity.Like::getReactionType)
                .orElse(null);

        return PostResponse.of(post, likeCount, myReactionType, reactionCounts, commentCount, s3BaseUrl());
    }

    public PostPageResponse getList(PostCategory category, int page, String email) {
        User user = findUserByEmail(email);
        List<Long> blockedIds = blockService.getBlockedUserIds(user.getId());
        PageRequest pageRequest = PageRequest.of(page, 10);

        Page<Post> postPage;
        if (category != null) {
            postPage = blockedIds.isEmpty()
                    ? postRepository.findByCategoryOrderByCreatedAtDesc(category, pageRequest)
                    : postRepository.findByCategoryExcludingUsersOrderByCreatedAtDesc(category, blockedIds, pageRequest);
        } else {
            postPage = blockedIds.isEmpty()
                    ? postRepository.findAllByOrderByCreatedAtDesc(pageRequest)
                    : postRepository.findAllExcludingUsersOrderByCreatedAtDesc(blockedIds, pageRequest);
        }

        List<PostSummaryResponse> summaries = postPage.getContent().stream()
                .map(p -> PostSummaryResponse.of(p, commentRepository.countByPostId(p.getId()), s3BaseUrl()))
                .toList();

        return new PostPageResponse(summaries, postPage.getNumber(), postPage.getTotalPages(), postPage.getTotalElements());
    }

    @Transactional
    public void delete(String email, Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("게시글을 찾을 수 없습니다."));
        User user = findUserByEmail(email);
        if (!post.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인 게시글만 삭제할 수 있습니다.");
        }
        likeRepository.deleteByPostId(id);
        commentRepository.deleteByPostId(id);
        postRepository.delete(post);
    }

    public PhotoUploadUrlResponse generatePhotoUploadUrl(PhotoUploadUrlRequest request, UserDetails userDetails) {
        if (!List.of("image/jpeg", "image/png").contains(request.contentType())) {
            throw new IllegalArgumentException("허용되지 않는 파일 형식입니다. image/jpeg 또는 image/png만 허용됩니다.");
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        String ext = request.contentType().equals("image/jpeg") ? "jpg" : "png";
        String objectKey = "posts/" + user.getId() + "/" + UUID.randomUUID() + "." + ext;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(objectKey)
                .contentType(request.contentType())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(300))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

        return new PhotoUploadUrlResponse(presignedRequest.url().toString(), objectKey, 300);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }

    private Map<String, Long> buildReactionCountMap(List<Object[]> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            ReactionType rt = (ReactionType) row[0];
            Long cnt = (Long) row[1];
            counts.put(rt.name(), cnt);
        }
        return counts;
    }
}
```

`PostNotFoundException`의 실제 생성자 시그니처가 `CheckinNotFoundException`과 동일한지 Task 2에서 작성한 내용을 확인하고 맞춘다. `BlockService.getBlockedUserIds`, `PhotoUploadUrlRequest`/`PhotoUploadUrlResponse`의 정확한 패키지·시그니처는 각각 `backend/src/main/java/com/starterkit/domain/block/service/BlockService.java`, `backend/src/main/java/com/starterkit/domain/checkin/dto/request/PhotoUploadUrlRequest.java`를 Read해서 확인한다(이미 checkin에서 쓰이는 범용 DTO이므로 import해서 그대로 재사용).

- [ ] **Step 8: 테스트 실행하여 통과 확인**

```bash
cd backend && ./gradlew.bat test --tests "com.starterkit.domain.board.service.PostServiceTest"
```
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/board/dto backend/src/main/java/com/starterkit/domain/board/service backend/src/test/java/com/starterkit/domain/board
git commit -m "✨ feat: PostService 생성/조회/목록/삭제/사진업로드 구현"
```

---

## Task 7: PostController — REST API 엔드포인트

**Files:**
- Create: `backend/src/main/java/com/starterkit/domain/board/controller/PostController.java`
- Modify: `backend/src/main/java/com/starterkit/global/config/SecurityConfig.java`

**Interfaces:**
- Consumes: `PostService` (Task 6)
- Produces: `POST /api/posts`, `GET /api/posts?category=&page=`, `GET /api/posts/{id}`, `DELETE /api/posts/{id}`, `POST /api/posts/photo-upload-url`

- [ ] **Step 1: PostController 작성**

`backend/src/main/java/com/starterkit/domain/checkin/controller/CheckinController.java` 패턴을 따른다:

```java
package com.starterkit.domain.board.controller;

import com.starterkit.domain.board.dto.request.CreatePostRequest;
import com.starterkit.domain.board.dto.response.PostPageResponse;
import com.starterkit.domain.board.dto.response.PostResponse;
import com.starterkit.domain.board.entity.PostCategory;
import com.starterkit.domain.board.service.PostService;
import com.starterkit.domain.checkin.dto.request.PhotoUploadUrlRequest;
import com.starterkit.domain.checkin.dto.response.PhotoUploadUrlResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "Posts", description = "게시판 관련 API")
@SecurityRequirement(name = "bearerAuth")
public class PostController {

    private final PostService postService;

    @PostMapping
    @Operation(summary = "게시글 작성")
    public ResponseEntity<PostResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreatePostRequest request) {
        return ResponseEntity.ok(postService.create(userDetails.getUsername(), request));
    }

    @GetMapping
    @Operation(summary = "게시글 목록 조회 (카테고리 필터 + 페이지네이션)")
    public ResponseEntity<PostPageResponse> getList(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) PostCategory category,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(postService.getList(category, page, userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "게시글 상세 조회")
    public ResponseEntity<PostResponse> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(postService.getById(userDetails.getUsername(), id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "게시글 삭제")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id) {
        postService.delete(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photo-upload-url")
    @Operation(summary = "게시글 사진 업로드 Presigned URL 발급")
    public ResponseEntity<PhotoUploadUrlResponse> getPhotoUploadUrl(
            @Valid @RequestBody PhotoUploadUrlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.generatePhotoUploadUrl(request, userDetails));
    }
}
```

- [ ] **Step 2: SecurityConfig에 /api/posts 인가 규칙 추가**

`backend/src/main/java/com/starterkit/global/config/SecurityConfig.java`의 `.requestMatchers(HttpMethod.GET, "/api/checkins/**").hasAnyRole("MEMBER", "FAMILY_VIEWER")` 줄 바로 아래에 추가:

```java
.requestMatchers(HttpMethod.GET, "/api/posts/**").hasAnyRole("MEMBER", "FAMILY_VIEWER")
```

쓰기 작업(POST/DELETE `/api/posts/**`)은 이미 마지막의 `.anyRequest().hasRole("MEMBER")`에 걸리므로 별도 규칙이 필요 없다.

- [ ] **Step 3: 컴파일 확인**

```bash
cd backend && ./gradlew.bat compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 백엔드 기동 후 수동 확인**

```bash
.\gradlew.bat bootRun --args='--spring.profiles.active=dev'
```
기동 후 Swagger UI(`http://localhost:8080/swagger-ui.html`)에서 `Posts` 태그가 노출되는지 확인한다.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/board/controller backend/src/main/java/com/starterkit/global/config/SecurityConfig.java
git commit -m "✨ feat: PostController 및 게시판 인가 규칙 추가"
```

---

## Task 8: CommentService/LikeService — 게시글 대상 메서드 추가 + PostController 확장

**Files:**
- Modify: `backend/src/main/java/com/starterkit/domain/comment/service/CommentService.java`
- Modify: `backend/src/main/java/com/starterkit/domain/like/service/LikeService.java`
- Modify: `backend/src/main/java/com/starterkit/domain/board/controller/PostController.java`

**Interfaces:**
- Consumes: `CommentRepository.findRootCommentsByPostId/deleteByPostId` (Task 4), `LikeRepository.findByUserIdAndPostId/deleteByUserIdAndPostId/countByReactionTypeForPost` (Task 4), `PostRepository` (Task 3)
- Produces: `CommentService.getCommentsForPost(Long postId, UserDetails): List<CommentResponse>`, `CommentService.addCommentToPost(Long postId, CreateCommentRequest, UserDetails): CommentResponse`, `LikeService.toggleReactionForPost(Long postId, LikeRequest, UserDetails): LikeResponse`. `PostController`에 `/api/posts/{id}/comments`, `/api/posts/{id}/likes` 엔드포인트 추가 (기존 CommentController/LikeController는 checkin 전용으로 그대로 유지 — 별도 컨트롤러를 만들지 않고 PostController에 위임 메서드를 추가해 경로 프리픽스를 `/api/posts`로 유지한다)

**설계 이유**: 기존 `CommentController`/`LikeController`는 `/api/checkins/{id}/...` 경로에 고정돼 있다. `/api/posts/{id}/comments` 같은 경로를 만들려면 새 컨트롤러 매핑이 필요하므로, `PostController`에 댓글/반응 엔드포인트를 추가하고 내부적으로 `CommentService`/`LikeService`의 신규 post 전용 메서드를 호출한다.

- [ ] **Step 1: CommentService에 post 대상 메서드 추가**

`backend/src/main/java/com/starterkit/domain/comment/service/CommentService.java`에 `PostRepository` 의존성을 주입하고 아래 메서드를 추가한다:

```java
private final PostRepository postRepository; // 생성자 주입 필드에 추가 (import com.starterkit.domain.board.repository.PostRepository)

public List<CommentResponse> getCommentsForPost(Long postId, UserDetails userDetails) {
    postRepository.findById(postId)
            .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다."));
    User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    List<Long> blockedIds = blockService.getBlockedUserIds(user.getId());
    if (!blockedIds.isEmpty()) {
        return commentRepository.findRootCommentsByPostIdExcludingUsers(postId, blockedIds)
                .stream().map(CommentResponse::from).toList();
    }
    return commentRepository.findRootCommentsByPostId(postId)
            .stream().map(CommentResponse::from).toList();
}

@Transactional
public CommentResponse addCommentToPost(Long postId, CreateCommentRequest req, UserDetails userDetails) {
    com.starterkit.domain.board.entity.Post post = postRepository.findById(postId)
            .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다."));
    User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

    Comment parent = null;
    if (req.parentId() != null) {
        parent = commentRepository.findById(req.parentId())
                .orElseThrow(() -> new ResourceNotFoundException("부모 댓글을 찾을 수 없습니다."));
    }

    Comment comment = Comment.builder()
            .user(user)
            .post(post)
            .parent(parent)
            .content(req.content() != null ? req.content() : "")
            .commentType(req.resolvedCommentType())
            .build();

    return CommentResponse.fromReply(commentRepository.save(comment));
}
```

알림(`notificationService`) 발송은 게시판 댓글에서는 범위 밖이므로 생략한다 — 신규 요구사항이 생기면 별도 태스크로 추가한다. `CommentRepository`의 import는 이미 `PostRepository`가 필요하므로 파일 상단에 추가한다.

- [ ] **Step 2: LikeService에 post 대상 메서드 추가**

`backend/src/main/java/com/starterkit/domain/like/service/LikeService.java`에 `PostRepository` 의존성을 주입하고 아래 메서드를 추가한다:

```java
private final PostRepository postRepository; // 생성자 주입 필드에 추가

@Transactional
public LikeResponse toggleReactionForPost(Long postId, LikeRequest request, UserDetails userDetails) {
    postRepository.findById(postId)
            .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다."));
    User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

    ReactionType incoming = request.resolvedReactionType();
    java.util.Optional<Like> existing = likeRepository.findByUserIdAndPostId(user.getId(), postId);

    boolean liked;
    ReactionType resultReactionType;

    if (existing.isPresent()) {
        likeRepository.deleteByUserIdAndPostId(user.getId(), postId);
        likeRepository.flush();

        if (existing.get().getReactionType() == incoming) {
            liked = false;
            resultReactionType = null;
        } else {
            com.starterkit.domain.board.entity.Post post = postRepository.getReferenceById(postId);
            likeRepository.save(Like.builder().user(user).post(post).reactionType(incoming).build());
            liked = true;
            resultReactionType = incoming;
        }
    } else {
        com.starterkit.domain.board.entity.Post post = postRepository.getReferenceById(postId);
        likeRepository.save(Like.builder().user(user).post(post).reactionType(incoming).build());
        liked = true;
        resultReactionType = incoming;
    }

    Map<String, Long> reactionCounts = buildReactionCountsForPost(postId);
    return new LikeResponse(liked, resultReactionType, reactionCounts);
}

private Map<String, Long> buildReactionCountsForPost(Long postId) {
    List<Object[]> rows = likeRepository.countByReactionTypeForPost(postId);
    Map<String, Long> counts = new LinkedHashMap<>();
    for (Object[] row : rows) {
        ReactionType rt = (ReactionType) row[0];
        Long cnt = (Long) row[1];
        counts.put(rt.name(), cnt);
    }
    return counts;
}
```

게시글 좋아요 알림도 범위 밖이므로 생략한다.

- [ ] **Step 3: PostController에 댓글/반응 엔드포인트 추가**

`backend/src/main/java/com/starterkit/domain/board/controller/PostController.java`에 `CommentService`, `LikeService` 의존성을 추가하고 엔드포인트를 붙인다:

```java
private final CommentService commentService;
private final LikeService likeService;

@GetMapping("/{id}/comments")
@Operation(summary = "게시글 댓글 목록 조회")
public ResponseEntity<List<CommentResponse>> getComments(
        @PathVariable("id") Long id,
        @AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.ok(commentService.getCommentsForPost(id, userDetails));
}

@PostMapping("/{id}/comments")
@Operation(summary = "게시글 댓글 작성")
public ResponseEntity<CommentResponse> addComment(
        @PathVariable("id") Long id,
        @Valid @RequestBody CreateCommentRequest req,
        @AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
            .body(commentService.addCommentToPost(id, req, userDetails));
}

@PostMapping("/{id}/likes")
@Operation(summary = "게시글 리액션 토글")
public ResponseEntity<LikeResponse> toggleReaction(
        @PathVariable("id") Long id,
        @RequestBody(required = false) LikeRequest request,
        @AuthenticationPrincipal UserDetails userDetails) {
    LikeRequest req = request != null ? request : new LikeRequest(null);
    return ResponseEntity.ok(likeService.toggleReactionForPost(id, req, userDetails));
}
```

필요한 import(`CommentResponse`, `CreateCommentRequest`, `LikeRequest`, `LikeResponse`, `CommentService`, `LikeService`, `List`)를 파일 상단에 추가한다. 댓글 삭제/수정 API는 이번 범위에서 프론트가 사용하지 않으므로(MVP 범위 밖) 생략한다.

- [ ] **Step 4: 컴파일 확인**

```bash
cd backend && ./gradlew.bat compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: 백엔드 기동 후 Swagger에서 엔드포인트 확인**

```bash
.\gradlew.bat bootRun --args='--spring.profiles.active=dev'
```
`/api/posts/{id}/comments`, `/api/posts/{id}/likes`가 Swagger UI에 노출되는지 확인.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/starterkit/domain/comment/service/CommentService.java backend/src/main/java/com/starterkit/domain/like/service/LikeService.java backend/src/main/java/com/starterkit/domain/board/controller/PostController.java
git commit -m "✨ feat: 게시글 댓글/반응 API 추가"
```

---

# Phase 3 — 프론트-백엔드 연결

## Task F: usePostMock → usePost(실제 API) 교체 + 신고/차단/공유 연결

**Files:**
- Create: `frontend/src/hooks/usePost.ts`
- Modify: `frontend/src/hooks/useReport.ts`
- Modify: `frontend/src/pages/BoardListPage.tsx`
- Modify: `frontend/src/pages/BoardWritePage.tsx`
- Modify: `frontend/src/pages/BoardDetailPage.tsx`

**Interfaces:**
- Consumes: `PostController` 전체 API (Phase 2), `useCreateReport` (기존 `useReport.ts`), `useBlockUser` (기존 `useBlock.ts`)
- Produces: `usePost.ts`가 Task A의 `usePostMock.ts`와 동일한 함수 이름·시그니처(`usePostList`, `usePostDetail`, `useCreatePost`, `useDeletePost`, `usePostPhotoUploadUrl`, `usePostComments`, `useCreatePostComment`, `usePostLikeToggle`)로 실제 TanStack Query 훅을 제공 — 화면 3개는 import 경로 교체(`@/hooks/usePostMock` → `@/hooks/usePost`)와 사진 업로드 로직 조정만 필요하다.

- [ ] **Step 1: usePost.ts 작성 (실제 API 훅)**

`frontend/src/hooks/useCheckin.ts`, `frontend/src/hooks/useComment.ts` 패턴을 따른다:

```typescript
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
  return useQuery({
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
      api.post('/posts', data).then(r => r.data),
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
  return useQuery({
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
```

`usePostComments`, `usePostDetail`의 반환 타입은 목업과 달리 `data`가 `undefined`일 수 있다(TanStack Query 로딩 중) — 화면 코드에서 이미 `isLoading`/`comments?.length` 형태로 방어하고 있는지 Step 3에서 확인한다.

- [ ] **Step 2: 타입 체크**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 에러 없음 (신규 파일만으로는 에러 발생 안 함)

- [ ] **Step 3: BoardListPage.tsx import 교체**

`frontend/src/pages/BoardListPage.tsx`에서:
```tsx
import { usePostList, type PostCategoryValue } from '@/hooks/usePostMock'
```
를
```tsx
import { usePostList, type PostCategoryValue } from '@/hooks/usePost'
```
로 변경한다. 나머지 로직은 변경 불필요 (Task A에서 인터페이스를 동일하게 맞췄으므로).

- [ ] **Step 4: BoardWritePage.tsx import 교체 및 실제 S3 업로드로 전환**

`frontend/src/pages/BoardWritePage.tsx`에서:
```tsx
import { useCreatePost, type PostCategoryValue } from '@/hooks/usePostMock'
```
를
```tsx
import { useCreatePost, usePostPhotoUploadUrl, type PostCategoryValue } from '@/hooks/usePost'
```
로 변경한다. `photoPreviews`(data URL)만 저장하던 목업 방식을, `frontend/src/pages/CheckinWritePage.tsx`의 `handleSubmit`처럼 `photoFiles: File[]`를 별도로 들고 있다가 제출 시 `getUploadUrl.mutateAsync` → `fetch(uploadUrl, { method: 'PUT', ... })` → `objectKeys.push(objectKey)` 흐름으로 교체한다:

```tsx
const [photoFiles, setPhotoFiles] = useState<File[]>([])
// ...handlePhotoChange에서 photoFiles도 함께 채운다 (CheckinWritePage.tsx 참고)

const getUploadUrl = usePostPhotoUploadUrl()

const handleSubmit = async () => {
  if (!category || !title.trim() || !content.trim()) return
  setIsSubmitting(true)
  try {
    const objectKeys: string[] = []
    for (const file of photoFiles) {
      const { uploadUrl, objectKey } = await getUploadUrl.mutateAsync({
        filename: file.name,
        contentType: file.type,
      })
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      objectKeys.push(objectKey)
    }
    const newPost = await createPost.mutateAsync({
      category, title: title.trim(), content: content.trim(),
      photoObjectKeys: objectKeys.length > 0 ? objectKeys : undefined,
    })
    toast.success('게시글을 등록했어요 🎉')
    navigate(`/board/${newPost.id}`)
  } catch {
    toast.error('등록에 실패했어요. 다시 시도해 주세요.')
  } finally {
    setIsSubmitting(false)
  }
}
```

- [ ] **Step 5: useReport.ts에 POST 타입 추가**

`frontend/src/hooks/useReport.ts`에서:
```typescript
type ReportTargetType = 'CHECKIN' | 'COMMENT'
```
를
```typescript
type ReportTargetType = 'CHECKIN' | 'COMMENT' | 'POST'
```
로 변경한다 (백엔드는 Phase 2 Task 5에서 이미 `POST`를 추가했다).

- [ ] **Step 6: BoardDetailPage.tsx import 교체 및 신고/차단/공유 버튼 추가**

`frontend/src/pages/BoardDetailPage.tsx`에서 import를 `@/hooks/usePostMock` → `@/hooks/usePost`로 교체하고, `useCreateReport`(`@/hooks/useReport`)와 `useBlockUser`(`@/hooks/useBlock`)를 추가로 import한다. Task D에서 만든 화면에 신고/차단 버튼(비소유자일 때만 노출)을 추가한다 — `frontend/src/components/ui/domain/checkin/checkin-card.tsx`의 `ReportModal`/`BlockConfirmModal` 패턴을 참고해 동일한 UX로 구현한다:

```tsx
import { useCreateReport } from '@/hooks/useReport'
import { useBlockUser } from '@/hooks/useBlock'

// ...컴포넌트 내부에 추가
const createReport = useCreateReport()
const blockUser = useBlockUser()

const handleReport = async () => {
  await createReport.mutateAsync({ targetType: 'POST', targetId: postId, reason: 'INAPPROPRIATE' })
  toast.success('신고가 접수되었습니다.')
}

const handleBlock = async () => {
  await blockUser.mutateAsync(post.userId)
  toast.success(`${post.nickname}님을 차단했습니다.`)
  navigate('/board')
}
```

헤더의 삭제 버튼 옆(비소유자 분기)에 신고/차단 버튼을 배치한다 — `frontend/src/CLAUDE.md`의 버튼 스타일 규칙을 따른다.

카카오톡/밴드 공유는 `frontend/src/pages/ActivityDetailPage.tsx`를 Read해서 공유 버튼이 어떤 유틸(`frontend/src/lib/` 하위)을 호출하는지 확인하고, 동일한 유틸을 게시글 상세에도 연결한다. 공유 URL은 checkin 공유가 `/share/checkin/:id` 패턴을 쓰는 것으로 보아, 게시글도 별도 공유 프리뷰 라우트가 필요한지 여부를 `ActivityDetailPage.tsx`의 실제 구현을 보고 판단한다 — 단순 현재 URL 공유로 충분하다면 별도 라우트 없이 `window.location.href` 공유로 대체한다(과설계 방지).

- [ ] **Step 7: 대댓글 UI 추가 검토**

Phase 2 Task 8에서 `addCommentToPost`가 `parentId`를 이미 지원하므로, 댓글 목록에 "답글 달기" 버튼과 중첩 렌더링을 추가할지 이 시점에 결정한다. 골든 패스 검증(Task G)에서 필요성이 확인되면 추가하고, 아니면 백로그로 남긴다(`docs/PRD.md`의 GROWTH-CHECKLIST 참고 — 이미 "대댓글 기능"이 백로그 항목으로 존재하는 것으로 보아 checkin에서도 후속 확장된 이력이 있다).

- [ ] **Step 8: 타입 체크 및 빌드**

```bash
cd frontend && npm run build
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 9: `usePostMock.ts` 삭제 여부 결정**

빌드가 통과하고 어느 페이지도 `usePostMock`을 import하지 않는지 확인한다(`grep -r usePostMock frontend/src`). 사용처가 없으면 삭제한다:

```bash
grep -rl "usePostMock" frontend/src
```
결과가 없으면:
```bash
git rm frontend/src/hooks/usePostMock.ts
```

- [ ] **Step 10: Commit**

```bash
git add frontend/src/hooks/usePost.ts frontend/src/hooks/useReport.ts frontend/src/pages/BoardListPage.tsx frontend/src/pages/BoardWritePage.tsx frontend/src/pages/BoardDetailPage.tsx
git commit -m "✨ feat: 게시판 실제 API 연결 (신고/차단/공유 포함)"
```

---

## Task G: 골든 패스 수동 검증 (백엔드 연결 후 최종 확인)

**Files:** 없음 (검증 전용 태스크)

**Interfaces:**
- Consumes: 전체 게시판 기능 (Phase 1~3)

- [ ] **Step 1: 백엔드/프론트 기동**

```bash
# 백엔드
cd backend && .\gradlew.bat bootRun --args='--spring.profiles.active=dev'
# 프론트
cd frontend && npm run dev -- --port 5173
```

- [ ] **Step 2: 브라우저로 골든 패스 확인 (실제 API 기준)**

1. 로그인 후 하단 탭바에 "게시판" 탭이 보이는지 확인
2. 게시판 탭 클릭 → 목록 페이지 진입, 카테고리 pill(전체/자유게시판/질문공간/정보공유) 노출 확인
3. "글쓰기" 클릭 → 카테고리 선택 + 제목/본문/사진 입력 → 등록 → 실제 S3 업로드 성공 및 상세 페이지로 이동 확인
4. 상세 페이지에서 반응(이모지) 클릭 → 카운트 반영, 새로고침 후에도 유지되는지 확인 (실제 DB 저장 검증)
5. 댓글 입력 후 등록 → 댓글 목록에 반영, 새로고침 후에도 유지되는지 확인
6. 목록으로 돌아가 방금 쓴 글이 제목+본문 미리보기+작성자/날짜/댓글수 형태로 표시되는지, 사진 첨부 시 오른쪽 썸네일이 보이는지 확인
7. 카테고리 필터를 다른 값으로 바꿔 목록이 필터링되는지 확인
8. 게시글 11개 이상 있는 카테고리에서 페이지네이션이 10개 단위로 끊기는지 확인
9. 다른 계정으로 로그인해 본인 글이 아닌 게시글에서 신고/차단 메뉴가 동작하는지 확인
10. FAMILY_VIEWER 계정으로 로그인해 "글쓰기" 버튼이 노출되지 않는지, `POST /api/posts` 직접 호출 시 403이 반환되는지 확인
11. 카카오톡/밴드 공유 버튼 동작 확인

- [ ] **Step 3: 문제 발견 시 각 담당 Task로 돌아가 수정**

발견된 버그는 관련 Task의 커밋 위에 새 커밋으로 수정한다 (기존 커밋 amend 금지).

- [ ] **Step 4: 최종 상태 보고**

전체 골든 패스가 통과하면 브랜치 `worktree-feat+board`에서 PR 생성 여부를 사용자에게 확인한다 (PR 생성은 사용자 명시적 요청 시에만 진행).

---

## Self-Review Notes

- **스펙 커버리지**: 설계 문서의 모든 항목(하단 탭, 3카테고리, 목록 포맷, 페이지네이션, 작성 포맷, 반응/댓글/대댓글/공유/신고/차단, MEMBER 전용 작성)이 Phase 1~3에 매핑됨. **대댓글**은 백엔드 API(Phase 2 Task 8)까지는 구현되지만 프론트 UI(답글 달기 버튼, 중첩 렌더링)는 Task F Step 7에서 "검토 후 필요시 추가"로 남겨뒀다 — 필수 요구사항이므로 Task F 실행자는 반드시 스킵하지 말고 구현할 것. **카카오톡/밴드 공유**도 Task F Step 6에서 기존 유틸 재사용을 명시했으나 구체 코드는 실행 시점에 `ActivityDetailPage.tsx`를 Read해서 확인해야 한다.
- **순서 변경 근거**: 사용자가 "프론트 골격을 먼저 보고 싶다"고 요청해 Phase 1(목업)을 맨 앞으로, Phase 2(백엔드)를 중간으로, 실제 연결을 Phase 3으로 재배치했다. Task A의 목업 훅은 Task F에서 정의하는 실제 `usePost.ts`와 함수 시그니처를 동일하게 맞춰 화면 컴포넌트(Task B/C/D)가 Phase 3에서 import 경로 교체만으로 실제 데이터에 연결되도록 설계했다.
- **타입 일관성**: `PostResponse`(백엔드, Phase 2 Task 6) ↔ 프론트 `usePostDetail` 반환 타입(Task F, `usePost.ts`) 간 필드명이 `photoUrls`, `myReactionType`, `reactionCounts`, `commentCount`로 일치하도록 맞춤. 목업(Task A)의 `PostDetail` 타입도 동일 필드명을 사용해 Task D의 화면 코드가 Phase 3에서 그대로 재사용 가능하도록 함.
- **위험 요소**: Flyway 마이그레이션 파일을 상시 두지 않는 이 저장소의 특수한 운영 방식 때문에 Phase 2 Task 1에서 로컬 DB에 수동 DDL을 적용해야 한다. 프로덕션 배포 시점에는 별도로 배포용 Flyway 마이그레이션 SQL 파일을 만들어 첫 배포 후 제거하는 절차를 사용자와 재확인해야 한다(이번 계획은 로컬 개발 환경 구축까지만 다룸).
