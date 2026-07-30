# 사진 탭 신설 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하단 탭바의 "찾기" 탭을 사진 풀배경 오버레이 그리드 형태의 "사진" 탭으로 교체하고, 기존 "찾기"(사람 검색/팔로잉/팔로워) 기능은 "나의활동" 페이지로 이동시킨다. 사진 탭에 항상 사진이 있는 카드만 노출되도록 상세 기록 작성 시 사진을 필수화한다.

**Architecture:** 프론트엔드 전용 변경. 기존 `useInfiniteTodayFeed` 무한스크롤 커서 패턴과 `FeedPage.tsx`의 IntersectionObserver 재사용 패턴을 그대로 새 `PhotoFeedPage`에 적용한다. 백엔드 API/쿼리 변경 없음 — 상세 기록 사진 필수화로 인해 `isSimple=false` 체크인은 항상 `photoUrls`를 가지므로, 클라이언트에서 `photoUrls.length > 0` 가드만으로 사진 탭 데이터를 확보한다. `DiscoverPage` 컴포넌트/라우트는 그대로 유지하고, 진입점만 하단 탭바에서 `MyActivityPage` 헤더 버튼으로 옮긴다.

**Tech Stack:** React 19, TypeScript, TailwindCSS 4, React Router v7, TanStack Query, lucide-react

## Global Constraints

- 컬러는 항상 `main`/`dark`/`light`/`grad`/`mA()`/`lA()` oklch 상수 + inline style 사용, Tailwind `bg-primary` 등 유틸리티 컬러 금지 (`frontend/src/CLAUDE.md`)
- Display 폰트는 `'Noto Serif KR', serif` (h1/h2/섹션 제목), Body는 기본값 유지
- 모든 버튼: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`, 최소 터치 타겟 `min-h-[48px]`
- 한국어 줄바꿈 방지: 고정폭 라벨은 `whitespace-nowrap`, 본문성 텍스트는 `wordBreak: 'keep-all'`
- 아이콘 전용 버튼은 `aria-label` 필수, 장식 아이콘은 `aria-hidden="true"`
- `100vh` 금지 → `min-h-screen`, 하단 고정 요소는 `pb-[env(safe-area-inset-bottom)]`
- 커밋은 사용자의 명시적 승인 없이 실행하지 않는다 — 이 플랜의 각 태스크 Step 5 "커밋"은 실행자가 사용자 승인 후 진행한다 (`.claude/rules/workflow.md` 규칙 7)
- 프론트엔드 UI 변경 태스크는 구현 후 `/web-design-guidelines` 스킬로 디자인 시스템 검증 후 Playwright로 골든 패스 검증한다 (`.claude/rules/workflow.md` 규칙 2, 3)

---

## File Structure

- **Create** `frontend/src/components/ui/domain/checkin/photo-feed-card.tsx` — 사진 풀배경 오버레이 카드 (Task 1)
- **Create** `frontend/src/pages/PhotoFeedPage.tsx` — 사진 탭 그리드 페이지, 무한스크롤 (Task 2)
- **Modify** `frontend/src/App.tsx` — `/photos` 라우트 추가 (Task 3)
- **Modify** `frontend/src/components/layout/BottomTabBar.tsx` — "찾기" 탭을 "사진" 탭으로 교체 (Task 3)
- **Modify** `frontend/src/pages/MyActivityPage.tsx` — 헤더 액션 버튼에 "사람 찾기" 진입점 추가 (Task 4)
- **Modify** `frontend/src/pages/CheckinWritePage.tsx` — 상세 모드 사진 필수화 (Task 5)

---

### Task 1: PhotoFeedCard 컴포넌트

**Files:**
- Create: `frontend/src/components/ui/domain/checkin/photo-feed-card.tsx`

**Interfaces:**
- Consumes: `CheckIn` 타입 (`frontend/src/types/index.ts:10-27`), `CATEGORY_META` (사용 안 함 — 사진 탭 카드는 카테고리 아이콘 미노출)
- Produces: `export default function PhotoFeedCard({ checkin, onClick }: { checkin: CheckIn; onClick: () => void })` — Task 2에서 `checkin.photoUrls[0]`, `checkin.title`, `checkin.nickname`, `checkin.reactionCounts`, `checkin.commentCount`, `checkin.createdAt`을 사용하는 카드. 클릭 핸들러만 받고 내부 상태 없음.

이 컴포넌트는 승인된 `/preview` 시안(4:5 비율, 하단 그라디언트 오버레이)을 정적 컴포넌트로 옮기는 작업이다. 로직 없이 props를 받아 렌더링만 한다.

- [ ] **Step 1: 컴포넌트 파일 작성**

```tsx
// frontend/src/components/ui/domain/checkin/photo-feed-card.tsx
import { Heart, MessageCircle } from 'lucide-react'
import type { CheckIn } from '@/types'

const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

function formatShortDate(createdAt: string): string {
  const date = new Date(createdAt + 'Z')
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`
}

interface Props {
  checkin: CheckIn
  onClick: () => void
}

export default function PhotoFeedCard({ checkin, onClick }: Props) {
  const photoUrl = checkin.photoUrls?.[0]
  if (!photoUrl) return null

  const totalReactions = Object.values(checkin.reactionCounts ?? {}).reduce((a, b) => a + b, 0)

  return (
    <article
      className="relative rounded-2xl overflow-hidden cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ aspectRatio: '4 / 5', boxShadow: `0 2px 16px ${mA(0.12)}`, '--tw-ring-color': 'oklch(0.62 0.15 220)' } as React.CSSProperties}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      aria-label={`${checkin.nickname}님의 활동: ${checkin.title}`}
    >
      <img
        src={photoUrl}
        alt={`${checkin.nickname}님의 ${checkin.title} 활동 사진`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{ background: 'linear-gradient(to top, oklch(0 0 0 / 0.75), oklch(0 0 0 / 0.25) 55%, transparent 100%)' }}
        aria-hidden="true"
      />
      <span
        className="absolute top-2.5 right-2.5 text-xs font-bold text-white px-2 py-1 rounded-full"
        style={{ background: 'oklch(0 0 0 / 0.35)', backdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      >
        {formatShortDate(checkin.createdAt)}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5">
        <h3
          className="text-white font-black text-base leading-snug line-clamp-1"
          style={{ wordBreak: 'keep-all', textShadow: '0 1px 4px oklch(0 0 0 / 0.4)' }}
        >
          {checkin.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-white/90 text-sm font-bold truncate">{checkin.nickname}</span>
          <div className="flex items-center gap-2.5 shrink-0" aria-hidden="true">
            <span className="flex items-center gap-1 text-white text-xs font-bold">
              <Heart size={13} />
              {totalReactions}
            </span>
            <span className="flex items-center gap-1 text-white text-xs font-bold">
              <MessageCircle size={13} />
              {checkin.commentCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

Run: `cd frontend && npx tsc --noEmit`
Expected: `photo-feed-card.tsx` 관련 에러 없음 (기존 미해결 에러가 있다면 무시하고 신규 에러만 확인)

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add frontend/src/components/ui/domain/checkin/photo-feed-card.tsx
git commit -m "feat: 사진 풀배경 오버레이 카드 컴포넌트 추가"
```

---

### Task 2: PhotoFeedPage 그리드 페이지

**Files:**
- Create: `frontend/src/pages/PhotoFeedPage.tsx`

**Interfaces:**
- Consumes: `PhotoFeedCard` (Task 1의 `{ checkin, onClick }` props), `useInfiniteTodayFeed('all')` (`frontend/src/hooks/useCheckin.ts:14-28`, 반환 타입 `TodayFeedPage`의 `checkins: any[]`, `hasMore`, `nextCursor`), `useAuthStore` (`frontend/src/store/authStore.ts`)
- Produces: `export default function PhotoFeedPage()` — Task 3의 라우트가 이 컴포넌트를 렌더링

전체 피드(`feedType='all'`) 데이터를 그대로 가져와 `photoUrls.length > 0`인 체크인만 필터링해 2열(모바일)/4열(데스크탑) 그리드로 렌더링한다. `FeedPage.tsx:151-172`의 IntersectionObserver 무한스크롤 패턴을 그대로 재사용한다.

- [ ] **Step 1: 페이지 파일 작성**

```tsx
// frontend/src/pages/PhotoFeedPage.tsx
import { useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import PhotoFeedCard from '@/components/ui/domain/checkin/photo-feed-card'
import { useInfiniteTodayFeed } from '@/hooks/useCheckin'
import type { CheckIn } from '@/types'

const main = 'oklch(0.62 0.15 220)'
const dark = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad = `linear-gradient(135deg, ${main}, ${light})`

export default function PhotoFeedPage() {
  const navigate = useNavigate()

  const {
    data: infiniteFeed,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTodayFeed('all')

  const sentinelRef = useRef<HTMLDivElement>(null)
  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const scrollContainer = el.closest('.overflow-y-auto') ?? null
    const observer = new IntersectionObserver(onIntersect, { root: scrollContainer, rootMargin: '300px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect])

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div role="status" aria-live="polite" aria-label="사진을 불러오는 중이에요" className="flex flex-col items-center gap-5 py-20">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: mA(0.12) }} aria-hidden="true">
            <svg className="animate-spin h-9 w-9" viewBox="0 0 24 24" fill="none" style={{ color: main }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-muted-foreground">잠깐만 기다려 주세요...</p>
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div role="alert" className="flex flex-col items-center gap-6 py-20 px-4 text-center">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: mA(0.10) }} aria-hidden="true">
            <span className="text-5xl">😔</span>
          </div>
          <p className="text-2xl font-bold text-foreground">사진을 불러오지 못했어요</p>
          <p className="text-lg font-medium text-muted-foreground leading-relaxed">인터넷 연결을 확인하신 후 다시 시도해 주세요</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[56px] px-10 text-lg font-bold rounded-2xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: grad, '--tw-ring-color': main } as React.CSSProperties}
          >
            다시 시도하기
          </button>
        </div>
      </main>
    )
  }

  const checkins = ((infiniteFeed?.pages ?? []).flatMap((p) => p.checkins).filter(Boolean) as CheckIn[])
    .filter((c) => (c.photoUrls?.length ?? 0) > 0)

  return (
    <main className="max-w-6xl mx-auto pt-4 pb-8 sm:py-8 sm:px-6 space-y-5">
      <div className="flex items-center gap-4 px-4 sm:px-0">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: grad }} aria-hidden="true">
          <Camera size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
          사진
        </h1>
        <div className="flex-1 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${mA(0.35)}, transparent)` }} aria-hidden="true" />
        <span className="text-sm font-black px-3 py-1.5 rounded-full shrink-0 text-white" style={{ background: grad }}>
          {checkins.length}개
        </span>
      </div>

      {checkins.length === 0 ? (
        <div className="flex flex-col items-center gap-7 py-20 px-4 text-center">
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${mA(0.10)}, ${mA(0.14)})` }} aria-hidden="true">
            <Camera size={52} style={{ color: main }} />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-foreground">아직 사진이 없어요</h3>
            <p className="text-lg font-medium text-muted-foreground leading-relaxed max-w-xs mx-auto" style={{ wordBreak: 'keep-all' }}>
              활동 기록에 사진을 추가하면 여기에 모아볼 수 있어요
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 px-4 sm:px-0">
            {checkins.map((checkin) => (
              <PhotoFeedCard
                key={checkin.id}
                checkin={checkin}
                onClick={() => navigate(`/checkin/${checkin.id}`)}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
          {!hasNextPage && checkins.length > 0 && (
            <p className="text-center text-sm font-semibold py-4" style={{ color: mA(0.45) }}>
              모든 사진을 확인했어요
            </p>
          )}
        </>
      )}
    </main>
  )
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

Run: `cd frontend && npx tsc --noEmit`
Expected: `PhotoFeedPage.tsx` 관련 에러 없음

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add frontend/src/pages/PhotoFeedPage.tsx
git commit -m "feat: 사진 탭 그리드 페이지 추가"
```

---

### Task 3: 라우팅 및 BottomTabBar 교체

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/BottomTabBar.tsx`

**Interfaces:**
- Consumes: `PhotoFeedPage` (Task 2의 default export)
- Produces: `/photos` 라우트, BottomTabBar의 "사진" 탭 항목 (Task 4 이후에도 변경 없음 — 최종 산출물)

`/discover` 라우트 자체는 유지(Task 4에서 진입점으로 사용). `/photos`를 새로 추가하고 BottomTabBar의 "찾기" 항목만 "사진"으로 교체한다.

- [ ] **Step 1: App.tsx에 PhotoFeedPage 라우트 추가**

`frontend/src/App.tsx:21` 근처(`import DiscoverPage from '@/pages/DiscoverPage'` 다음 줄)에 추가:

```tsx
import PhotoFeedPage from '@/pages/PhotoFeedPage'
```

`frontend/src/App.tsx:112` (`<Route path="discover" element={<DiscoverPage />} />`) 다음 줄에 추가:

```tsx
            <Route path="photos" element={<PhotoFeedPage />} />
```

- [ ] **Step 2: BottomTabBar에서 "찾기" 탭을 "사진"으로 교체**

`frontend/src/components/layout/BottomTabBar.tsx:1`의 import를 변경:

```tsx
import { LayoutList, Users, UserCircle2, Camera } from 'lucide-react'
```

`frontend/src/components/layout/BottomTabBar.tsx:35-42`의 "찾기" 탭 객체를 교체:

```tsx
    {
      path: '/photos',
      label: '사진',
      ariaLabel: '사진 모아보기',
      matchPrefix: true,
      icon: <Camera size={26} className="text-muted-foreground" aria-hidden="true" />,
      iconActive: <Camera size={26} className="text-white" aria-hidden="true" />,
    },
```

- [ ] **Step 3: dev 서버에서 라우트 수동 확인**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/photos` (실행 중인 dev 서버 포트로 대체)
Expected: `200`

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add frontend/src/App.tsx frontend/src/components/layout/BottomTabBar.tsx
git commit -m "feat: 하단 탭바 찾기 탭을 사진 탭으로 교체"
```

---

### Task 4: MyActivityPage에 "사람 찾기" 진입점 추가

**Files:**
- Modify: `frontend/src/pages/MyActivityPage.tsx`

**Interfaces:**
- Consumes: 기존 `/discover` 라우트 (Task 3에서 유지됨)
- Produces: MyActivityPage 헤더의 새 아이콘 버튼 (다른 태스크에 영향 없음)

`MyActivityPage.tsx:114-141`의 액션 버튼 그룹(편집/월간리포트/차단목록)에 "사람 찾기" 버튼을 추가한다. 기존 3개 버튼과 동일한 스타일(`min-h-[44px] min-w-[44px]`, `mA(0.10)` 배경)을 따른다.

- [ ] **Step 1: import에 Search 아이콘 추가**

`frontend/src/pages/MyActivityPage.tsx:3`을 변경:

```tsx
import { ChevronLeft, ChevronRight, BarChart2, Pencil, ShieldOff, Search, Footprints, ChefHat, BookOpen, Sprout, Dumbbell, Users, MoreHorizontal } from 'lucide-react'
```

- [ ] **Step 2: 액션 버튼 그룹에 "사람 찾기" 버튼 추가**

`frontend/src/pages/MyActivityPage.tsx:125-132`(편집 버튼과 월간 리포트 버튼 사이)에 추가:

```tsx
            <button
              onClick={() => navigate('/discover')}
              aria-label="사람 찾기"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all active:scale-95 [-webkit-tap-highlight-color:transparent]"
              style={{ background: mA(0.10), color: dark }}
            >
              <Search size={18} aria-hidden="true" />
            </button>
```

전체 배치는 편집 → 사람 찾기 → 월간 리포트 → 차단 목록 순서가 된다.

- [ ] **Step 3: TypeScript 컴파일 확인**

Run: `cd frontend && npx tsc --noEmit`
Expected: `MyActivityPage.tsx` 관련 에러 없음

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add frontend/src/pages/MyActivityPage.tsx
git commit -m "feat: 나의활동 페이지에 사람 찾기 진입점 추가"
```

---

### Task 5: 상세 기록 사진 필수화

**Files:**
- Modify: `frontend/src/pages/CheckinWritePage.tsx`

**Interfaces:**
- Consumes: 기존 `photoFiles` state (`CheckinWritePage.tsx:35`)
- Produces: 없음 (최종 산출물 — 사진 탭 데이터 정합성의 전제 조건)

상세 모드에서 사진 없이 제출 가능했던 것을 막는다. 라벨 텍스트와 제출 가능 조건만 수정한다.

- [ ] **Step 1: 사진 첨부 섹션 라벨을 필수로 변경**

`frontend/src/pages/CheckinWritePage.tsx:284-287`을 변경:

```tsx
              <p id="photo-label" className="text-lg font-bold text-foreground">
                사진 첨부{' '}
                <span className="text-base font-medium text-muted-foreground">(필수, 최대 3장)</span>
              </p>
```

- [ ] **Step 2: canSubmitDetail 조건에 사진 필수 추가**

`frontend/src/pages/CheckinWritePage.tsx:126`을 변경:

```tsx
  const canSubmitDetail = !!selectedCategory && !!title.trim() && photoFiles.length > 0 && !isSubmitting
```

- [ ] **Step 3: 사진 미첨부 안내 문구 추가**

`frontend/src/pages/CheckinWritePage.tsx:356`(사진 첨부 `</section>` 닫는 태그) 바로 앞, 사진 그리드(`</div>` at line 355) 다음에 추가:

```tsx
              {photoPreviews.length === 0 && (
                <p className="text-sm font-semibold text-center" style={{ color: mA(0.55) }} aria-live="polite">
                  상세 기록에는 사진이 1장 이상 필요해요
                </p>
              )}
```

- [ ] **Step 4: TypeScript 컴파일 확인**

Run: `cd frontend && npx tsc --noEmit`
Expected: `CheckinWritePage.tsx` 관련 에러 없음

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add frontend/src/pages/CheckinWritePage.tsx
git commit -m "feat: 상세 기록 작성 시 사진 첨부 필수화"
```

---

### Task 6: 통합 검증 (디자인 가이드라인 + Playwright)

**Files:** 없음 (검증 전용 태스크)

**Interfaces:**
- Consumes: Task 1~5의 모든 변경사항

`.claude/rules/workflow.md` 규칙에 따라 프론트엔드 UI 변경 완료 후 반드시 거쳐야 하는 검증 단계다.

- [ ] **Step 1: `/web-design-guidelines` 스킬로 디자인 시스템 검증**

Task 1(PhotoFeedCard), Task 2(PhotoFeedPage), Task 4(MyActivityPage 버튼) 변경분에 대해 `/web-design-guidelines` 스킬을 호출해 디자인 토큰 사용, 접근성, 터치 타겟 기준 위반 여부를 점검한다. 위반 발견 시 즉시 수정 후 재검증.

- [ ] **Step 2: 백엔드 및 프론트엔드 dev 서버 기동 확인**

Run (워크트리 루트에서): `cd frontend && npm run dev`
필요 시 백엔드도 `.\gradlew.bat bootRun --args='--spring.profiles.active=dev'`로 기동 (이미 실행 중이면 재시작하지 않음 — `.claude/rules/commands.md` 포트 충돌 정책).

- [ ] **Step 3: Playwright로 사진 탭 골든 패스 검증**

`user1@test.com` / `123` 계정으로 로그인 후:
1. 하단 탭바에 "사진" 탭이 보이고 "찾기" 탭이 사라졌는지 확인
2. "사진" 탭 클릭 → `/photos`로 이동, 그리드에 사진 카드가 렌더링되는지 확인
3. 사진 카드 클릭 → 해당 체크인 상세 페이지(`/checkin/:id`)로 이동하는지 확인
4. "나의활동" 탭 이동 → 헤더에 "사람 찾기" 아이콘 버튼이 보이는지 확인, 클릭 시 `/discover`로 이동하는지 확인
5. "활동 기록하기" → 상세 모드 선택 → 사진 없이 제출 버튼이 비활성 상태인지 확인, 사진 1장 추가 후 활성화되는지 확인
6. `mcp__playwright__browser_console_messages`로 콘솔 에러 없음 확인

검증 실패 시 즉시 수정 후 재검증한다. 사용자에게 "검증 완료"라고 보고하지 않고, 실제 스크린샷/콘솔 로그 결과를 근거로 보고한다.

- [ ] **Step 4: ROADMAP.md 업데이트 (해당 항목이 있는 경우)**

`docs/ROADMAP.md`에 사진 탭 관련 항목이 있다면 완료 상태(`[x]`)로 업데이트한다. 항목이 없다면 이 스텝은 스킵한다.

---

## Self-Review 결과

**스펙 커버리지**: 설계 문서(`docs/superpowers/specs/2026-07-30-photo-feed-tab-design.md`)의 변경 범위 1~3 항목(사진 탭 신설, 찾기 기능 이동, 사진 필수화)이 각각 Task 1~3, Task 4, Task 5에 매핑됨. "비범위" 항목(백엔드 변경, 기존 피드 스타일 변경, 팔로우 필터)은 계획에 포함하지 않음 — 일치.

**타입 일관성**: `CheckIn` 타입(`types/index.ts:10-27`)의 `photoUrls`, `reactionCounts`, `commentCount`, `createdAt`, `nickname`, `title` 필드명이 Task 1(PhotoFeedCard)과 Task 2(PhotoFeedPage) 전체에서 동일하게 사용됨. `useInfiniteTodayFeed`의 반환 타입(`TodayFeedPage.checkins: any[]`)을 Task 2에서 `CheckIn[]`로 캐스팅하는 부분은 기존 `FeedPage.tsx:286-288`과 동일한 패턴.
