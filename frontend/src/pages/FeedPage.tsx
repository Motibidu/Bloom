import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useScrollContainer } from '@/lib/scrollContext'
import { Users, PenLine, ClipboardList, UserCheck } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/shadcn/sheet'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import { useInfiniteTodayFeed, useSameCategoryUsers, useDeleteCheckin } from '@/hooks/useCheckin'
import { useFollowToggle } from '@/hooks/useFollow'
import { useAuthStore } from '@/store/authStore'
import { CATEGORY_META } from '@/lib/categories'
import type { ActivitySummaryItem } from '@/types'

// ── Warm Blue 테마 상수 ────────────────────────────────────────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

const btnPrimary: React.CSSProperties = {
  background: grad,
  color: 'white',
  transition: 'opacity 0.2s, transform 0.15s',
}

function formatTodayKo(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일 (${weekdays[now.getDay()]})`
}

function getParticipationMessage(count: number): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return `오전에만 벌써 ${count}명이 활동을 기록했어요`
  if (hour >= 12 && hour < 18) return `오늘 오후에 벌써 ${count}명이 활동을 기록했어요`
  return `오늘 하루 ${count}명이 활동을 기록했어요`
}

// 피드 카드 래퍼 — 삭제 hook을 카드별로 개별 인스턴스화
function FeedCheckinCard({
  checkin,
  currentUserId,
  onNavigate,
  onAlsoCheckin,
  canInteract,
}: {
  checkin: any
  currentUserId?: number
  onNavigate: () => void
  onAlsoCheckin: () => void
  canInteract: boolean
}) {
  const isOwner = currentUserId != null && checkin.userId === currentUserId
  const deleteCheckin = useDeleteCheckin(checkin.id)

  const handleDelete = isOwner
    ? () => deleteCheckin.mutate()
    : undefined

  return (
    <CheckInCard
      checkin={checkin}
      onClick={onNavigate}
      isOwner={isOwner}
      onDelete={handleDelete}
      onAlsoCheckin={canInteract ? onAlsoCheckin : undefined}
      canInteract={canInteract}
    />
  )
}

function SameCategoryUserRow({ user, currentUserId, onFollowSuccess }: { user: any; currentUserId?: number; onFollowSuccess?: () => void }) {
  const navigate = useNavigate()
  const followToggle = useFollowToggle(user.id, user.isFollowing)

  const handleFollow = () => {
    followToggle.mutate(undefined, { onSuccess: onFollowSuccess })
  }

  return (
    <li className="flex items-center gap-4">
      <button
        type="button"
        aria-label={`${user.nickname} 프로필 보기`}
        onClick={() => navigate(`/users/${user.id}`)}
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2"
        style={{ background: `linear-gradient(135deg, ${mA(0.2)}, ${lA(0.2)})` }}
      >
        <span className="font-black text-base" style={{ color: dark }}>{user.nickname?.[0] ?? '?'}</span>
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-base text-foreground truncate">{user.nickname}</p>
        {user.bio && <p className="text-sm text-muted-foreground truncate">{user.bio}</p>}
        <p className="text-xs text-muted-foreground">팔로워 {user.followerCount}명</p>
      </div>

      {currentUserId !== user.id && (
        <button
          type="button"
          aria-label={user.isFollowing ? '팔로우 취소' : '팔로우'}
          onClick={handleFollow}
          disabled={followToggle.isPending}
          className="min-w-[80px] h-10 rounded-xl text-sm font-bold px-4 shrink-0 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
          style={user.isFollowing
            ? { background: mA(0.10), color: dark, border: `1px solid ${mA(0.25)}` }
            : { background: grad, color: 'white' }}
        >
          {user.isFollowing ? <span className="flex items-center gap-1"><UserCheck size={14} />팔로잉</span> : '팔로우'}
        </button>
      )}
    </li>
  )
}

const SCROLL_KEY = 'feed-scroll-y'

export default function FeedPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const promptIdFromState = (location.state as { promptId?: number } | null)?.promptId ?? null
  const scrollContainer = useScrollContainer()

  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all')

  const [sameCategorySheetOpen, setSameCategorySheetOpen] = useState(false)
  const [isScrolledDown, setIsScrolledDown] = useState(false)

  const {
    data: infiniteFeed,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTodayFeed(feedTab)

  // 복원 대상 스크롤 위치 (마운트 시 sessionStorage에서 1회만 읽음)
  const restoreTargetRef = useRef<number | null>(null)
  if (restoreTargetRef.current === null) {
    const saved = sessionStorage.getItem(SCROLL_KEY)
    restoreTargetRef.current = saved ? Number(saved) : -1
    sessionStorage.removeItem(SCROLL_KEY)
  }
  // 복원 진행 중에는 저장을 막기 위한 플래그
  const restoringRef = useRef(restoreTargetRef.current >= 0)

  // IntersectionObserver — 하단 센티넬 감지 시 다음 페이지 로드
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
    // Layout의 스크롤 컨테이너(main.overflow-y-auto)를 root로 지정
    const scrollContainer = el.closest('.overflow-y-auto') ?? null
    const observer = new IntersectionObserver(onIntersect, {
      root: scrollContainer,
      rootMargin: '300px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect])

  useEffect(() => {
    if (promptIdFromState !== null) {
      window.history.replaceState({}, '')
    }
  }, [promptIdFromState])

  const { data: sameCategoryUsers, refetch: fetchSameCategoryUsers, isFetching: isFetchingUsers } = useSameCategoryUsers()
  const currentUser = useAuthStore((s) => s.user)
  const canWriteFeed = currentUser?.canWriteFeed ?? false

  // 스크롤 위치 복원 — DOM 높이가 목표치를 수용할 때까지(무한 스크롤로 페이지 추가) 재시도.
  // ⚠ early return(로딩/에러)보다 위에 있어야 hook 호출 순서가 일정하게 유지된다.
  const loadedCheckinCount = (infiniteFeed?.pages ?? []).reduce((n, p) => n + p.checkins.length, 0)
  useEffect(() => {
    const target = restoreTargetRef.current
    if (target === null || target < 0) return
    if (isLoading) return
    const el = scrollContainer?.current
    if (!el) return

    if (el.scrollHeight - el.clientHeight >= target) {
      el.scrollTop = target
      restoreTargetRef.current = -1
      // 복원 직후 발생하는 scroll 이벤트가 위치를 덮어쓰지 않도록 다음 프레임까지 차단 유지
      requestAnimationFrame(() => { restoringRef.current = false })
      return
    }
    // 높이가 부족하면 다음 페이지를 당겨 복원에 필요한 높이를 확보
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [isLoading, loadedCheckinCount, hasNextPage, isFetchingNextPage, fetchNextPage, scrollContainer])

  // 스크롤 200px 이상 내리면 데스크탑 FAB 표시
  useEffect(() => {
    const el = scrollContainer?.current
    if (!el) return
    const onScroll = () => setIsScrolledDown(el.scrollTop > 200)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollContainer])

  // ── 로딩 ────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div
          role="status"
          aria-live="polite"
          aria-label="피드를 불러오는 중이에요"
          className="flex flex-col items-center gap-5 py-20"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: mA(0.12) }}
            aria-hidden="true"
          >
            <svg
              className="animate-spin h-9 w-9"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: main }}
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-muted-foreground">잠깐만 기다려 주세요...</p>
        </div>
      </main>
    )
  }

  // ── 에러 ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div role="alert" className="flex flex-col items-center gap-6 py-20 px-4 text-center">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: mA(0.10) }}
            aria-hidden="true"
          >
            <span className="text-5xl">😔</span>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground">
              피드를 불러오지 못했어요
            </p>
            <p className="text-lg font-medium text-muted-foreground leading-relaxed">
              인터넷 연결을 확인하신 후 다시 시도해 주세요
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[56px] px-10 text-lg font-bold rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...btnPrimary, '--tw-ring-color': main } as React.CSSProperties}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            다시 시도하기
          </button>
        </div>
      </main>
    )
  }

  // infinite query — 첫 페이지에서 집계값 추출, 전체 페이지 체크인 flatMap
  const firstPage = infiniteFeed?.pages?.[0]
  const sameCategoryUserCount: number = firstPage?.sameCategoryUserCount ?? 0
  const totalCheckinCount: number = firstPage?.totalCheckinCount ?? 0
  const activitySummary = firstPage?.activitySummary ?? []
  const checkins = (infiniteFeed?.pages ?? [])
    .flatMap((p) => p.checkins)
    .filter(Boolean)

  // 떠나기 직전 스크롤 위치 저장 (상세 진입 시 onNavigate에서 호출)
  const saveScroll = () => {
    if (restoringRef.current) return
    const el = scrollContainer?.current
    if (el) sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop))
  }

  return (
    <main className="max-w-6xl mx-auto pt-4 pb-8 sm:py-8 sm:px-6 space-y-5 sm:space-y-8">

      {/* ── 통합 인사말 헤더 ──────────────────────────────────────────────── */}
      <div className="hidden md:flex items-stretch gap-4 sm:px-0">
        <header
          className="flex-1 rounded-2xl px-4 py-3 space-y-2"
          style={{
            background: `linear-gradient(135deg, ${mA(0.08)}, ${lA(0.12)})`,
            border: `1px solid ${mA(0.15)}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: dark }}>
                {formatTodayKo()}
              </p>
              <h1 className="text-base font-black text-foreground leading-snug" style={{ wordBreak: 'keep-all' }}>
                오늘도 좋은 하루 되세요!
              </h1>
            </div>
          </div>
          {totalCheckinCount > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              🌡️ {getParticipationMessage(totalCheckinCount)}
            </span>
          )}
          {(activitySummary.length > 0 || sameCategoryUserCount > 0) && (
            <div className="relative">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 snap-x snap-mandatory" style={{ maskImage: 'linear-gradient(to right, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}>
                {sameCategoryUserCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSameCategorySheetOpen(true); fetchSameCategoryUsers() }}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 rounded-lg min-h-[28px] text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 hover:opacity-80 transition-opacity"
                    style={{ background: mA(0.14), color: dark, border: `1px solid ${mA(0.25)}`, '--tw-ring-color': main } as React.CSSProperties}
                  >
                    <Users size={11} aria-hidden="true" />
                    같은 활동 {sameCategoryUserCount}명
                    <span aria-hidden="true">→</span>
                  </button>
                )}
                {[...activitySummary]
                  .sort((a, b) => (a.category === 'OTHER' ? 1 : b.category === 'OTHER' ? -1 : 0))
                  .map((item: ActivitySummaryItem) => {
                    const { icon: Icon, label } = CATEGORY_META[item.category]
                    return (
                      <div
                        key={item.category}
                        className="shrink-0 snap-start flex items-center gap-1 px-2.5 rounded-lg min-h-[28px]"
                        style={{ background: mA(0.06), border: `1px solid ${mA(0.10)}` }}
                      >
                        <Icon size={12} style={{ color: mA(0.45) }} aria-hidden="true" />
                        <span className="text-xs font-medium" style={{ color: mA(0.55) }}>{label}</span>
                        <span className="text-xs font-semibold" style={{ color: mA(0.55) }}>{item.count}명</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </header>
        {/* 데스크탑 — 헤더 오른쪽 외부 기록하기 버튼 */}
        {canWriteFeed && (
          <button
            type="button"
            aria-label="오늘 활동 기록하기"
            onClick={() => navigate('/checkin/write')}
            className="inline-flex items-center gap-2 px-6 rounded-2xl text-base font-bold text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:opacity-90 active:opacity-80 transition-opacity"
            style={{
              background: grad,
              boxShadow: `0 4px 16px ${mA(0.30)}`,
              '--tw-ring-color': main,
            } as React.CSSProperties}
          >
            <PenLine size={18} aria-hidden="true" />
            기록하기
          </button>
        )}
      </div>
      {/* 모바일 통합 헤더 */}
      <header
        className="md:hidden px-4 py-3 space-y-2"
        style={{
          background: `linear-gradient(135deg, ${mA(0.08)}, ${lA(0.12)})`,
          borderTop: `1px solid ${mA(0.15)}`,
          borderBottom: `1px solid ${mA(0.15)}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: dark }}>
              {formatTodayKo()}
            </p>
            <h1 className="text-base font-black text-foreground leading-snug" style={{ wordBreak: 'keep-all' }}>
              오늘도 좋은 하루 되세요!
            </h1>
          </div>
          <span className="text-2xl shrink-0" aria-hidden="true">☀️</span>
        </div>
        {totalCheckinCount > 0 && (
          <span className="text-sm font-medium text-muted-foreground">
            🌡️ {getParticipationMessage(totalCheckinCount)}
          </span>
        )}
        {(activitySummary.length > 0 || sameCategoryUserCount > 0) && (
          <div className="relative">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 snap-x snap-mandatory" style={{ maskImage: 'linear-gradient(to right, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}>
              {sameCategoryUserCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setSameCategorySheetOpen(true); fetchSameCategoryUsers() }}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 rounded-lg min-h-[28px] text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 hover:opacity-80 transition-opacity"
                  style={{ background: mA(0.14), color: dark, border: `1px solid ${mA(0.25)}`, '--tw-ring-color': main } as React.CSSProperties}
                >
                  <Users size={11} aria-hidden="true" />
                  같은 활동 {sameCategoryUserCount}명
                  <span aria-hidden="true">→</span>
                </button>
              )}
              {[...activitySummary]
                .sort((a, b) => (a.category === 'OTHER' ? 1 : b.category === 'OTHER' ? -1 : 0))
                .map((item: ActivitySummaryItem) => {
                  const { icon: Icon, label } = CATEGORY_META[item.category]
                  return (
                    <div
                      key={item.category}
                      className="shrink-0 snap-start flex items-center gap-1 px-2.5 rounded-lg min-h-[28px]"
                      style={{ background: mA(0.06), border: `1px solid ${mA(0.10)}` }}
                    >
                      <Icon size={12} style={{ color: mA(0.45) }} aria-hidden="true" />
                      <span className="text-xs font-medium" style={{ color: mA(0.55) }}>{label}</span>
                      <span className="text-xs font-semibold" style={{ color: mA(0.55) }}>{item.count}명</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </header>

      {/* ── 같은 카테고리 사용자 바텀시트 ──────────────────────────────────── */}
      <Sheet open={sameCategorySheetOpen} onOpenChange={setSameCategorySheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] overflow-y-auto px-6 pb-8">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-black" style={{ color: dark }}>
              나와 같은 활동을 한 이웃
            </SheetTitle>
          </SheetHeader>

          {isFetchingUsers ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${main} transparent transparent transparent` }} />
            </div>
          ) : (sameCategoryUsers ?? []).length === 0 ? (
            <p className="text-center text-base text-muted-foreground py-10">아직 같은 활동을 한 이웃이 없어요.</p>
          ) : (
            <ul className="space-y-4">
              {(sameCategoryUsers ?? []).map((u: any) => (
                <SameCategoryUserRow key={u.id} user={u} currentUserId={currentUser?.id} onFollowSuccess={fetchSameCategoryUsers} />
              ))}
            </ul>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 체크인 작성 영역 (GUEST 제외) ──────────────────────────────────── */}
      {!canWriteFeed && (
        <div
          className="mx-4 sm:mx-0 rounded-2xl px-6 py-5 flex items-center gap-3"
          style={{ background: mA(0.05), border: `1px dashed ${mA(0.2)}` }}
          role="note"
          aria-label="가족 피드 열람 전용"
        >
          <span className="text-2xl" aria-hidden="true">👀</span>
          <p className="text-base font-bold text-foreground/60">
            가족의 활동을 응원해 보세요. 활동 기록은 본인 계정으로만 작성할 수 있어요.
          </p>
        </div>
      )}

      {/* ── 피드 목록 ────────────────────────────────────────────────────────── */}
      <section aria-label="오늘의 활동 피드">
        {/* 피드 탭 — 항상 표시 */}
        <div
          className="flex gap-2 mb-6 px-4 sm:px-0"
          role="tablist"
          aria-label="피드 유형 선택"
        >
          <button
            role="tab"
            aria-selected={feedTab === 'all'}
            onClick={() => setFeedTab('all')}
            className="flex items-center gap-2 min-h-[48px] px-6 rounded-2xl text-base font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: feedTab === 'all' ? grad : mA(0.08),
              color: feedTab === 'all' ? 'white' : dark,
              '--tw-ring-color': main,
            } as React.CSSProperties}
          >
            전체 피드
          </button>
          <button
            role="tab"
            aria-selected={feedTab === 'following'}
            onClick={() => setFeedTab('following')}
            className="flex items-center gap-2 min-h-[48px] px-6 rounded-2xl text-base font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: feedTab === 'following' ? grad : mA(0.08),
              color: feedTab === 'following' ? 'white' : dark,
              '--tw-ring-color': main,
            } as React.CSSProperties}
          >
            팔로우 피드
          </button>
        </div>

        {/* 섹션 헤더 */}
        <div className="flex items-center gap-4 mb-7 px-4 sm:px-0">
          <h2 className="text-2xl font-black text-foreground shrink-0">
            오늘의 활동들
          </h2>
          <div
            className="flex-1 h-0.5 rounded-full"
            style={{ background: `linear-gradient(90deg, ${mA(0.35)}, ${lA(0.15)}, transparent)` }}
            aria-hidden="true"
          />
          <span
            className="text-sm font-black px-3 py-1.5 rounded-full shrink-0 text-white"
            style={{ background: grad }}
          >
            {checkins.length}개
          </span>
        </div>

        {/* 피드 콘텐츠 */}
        {checkins.length === 0 ? (
          feedTab === 'following' ? (
            <div
              className="rounded-2xl px-6 py-10 flex flex-col items-center gap-4 text-center"
              style={{ background: mA(0.05), border: `1px dashed ${mA(0.20)}` }}
            >
              <span className="text-4xl" aria-hidden="true">👥</span>
              <p className="text-lg font-black text-foreground">팔로우한 분들의 활동이 없어요</p>
              <p className="text-base font-medium text-muted-foreground">
                사람 찾기에서 이웃을 팔로우해보세요
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-7 py-20 px-4 text-center">
              <div
                className="w-28 h-28 rounded-3xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${mA(0.10)}, ${lA(0.14)})` }}
                aria-hidden="true"
              >
                <ClipboardList size={52} style={{ color: main }} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-foreground">
                  아직 활동이 없어요
                </h3>
                <p className="text-lg font-medium text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  첫 번째로 오늘 활동을 기록해 보세요! 작은 기록이 큰 추억이 됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/checkin/write')}
                className="h-16 px-12 text-xl font-black rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...btnPrimary, '--tw-ring-color': main } as React.CSSProperties}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                지금 기록하기
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col sm:gap-6">
            {checkins.map((checkin: any, idx: number) => (
              <React.Fragment key={checkin.id}>
                {idx > 0 && <div className="sm:hidden h-4" style={{ background: 'oklch(0.96 0.01 220)' }} aria-hidden="true" />}
                <FeedCheckinCard
                  checkin={checkin}
                  currentUserId={currentUser?.id}
                  canInteract={canWriteFeed}
                  onNavigate={() => { saveScroll(); navigate(`/checkin/${checkin.id}`) }}
                  onAlsoCheckin={() => navigate('/checkin/write')}
                />
              </React.Fragment>
            ))}

            {/* 스켈레톤 로딩 카드 — 다음 페이지 로드 중 표시 */}
            {isFetchingNextPage && (
              <>
                {[0, 1].map((i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="rounded-none sm:rounded-2xl bg-card p-5 space-y-4 animate-pulse"
                    style={{ border: `1px solid ${mA(0.10)}` }}
                    aria-hidden="true"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full" style={{ background: mA(0.12) }} />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 rounded-full w-24" style={{ background: mA(0.12) }} />
                        <div className="h-3 rounded-full w-16" style={{ background: mA(0.08) }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 rounded-full w-full" style={{ background: mA(0.10) }} />
                      <div className="h-4 rounded-full w-4/5" style={{ background: mA(0.08) }} />
                      <div className="h-4 rounded-full w-3/5" style={{ background: mA(0.06) }} />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-8 rounded-xl w-16" style={{ background: mA(0.10) }} />
                      <div className="h-8 rounded-xl w-16" style={{ background: mA(0.08) }} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* 인터섹션 센티넬 — 화면 진입 시 다음 페이지 로드 트리거 */}
            <div ref={sentinelRef} className="h-4" aria-hidden="true" />

            {/* 마지막 페이지 안내 */}
            {!hasNextPage && checkins.length > 0 && (
              <p
                className="text-center text-sm font-semibold py-4"
                style={{ color: mA(0.45) }}
              >
                모든 활동을 확인했어요
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── 활동 기록 FAB ────────────────────────────────────────────────────── */}
      {/* 모바일: 항상 표시 / 데스크탑: 200px 이상 스크롤 시 표시 */}
      {canWriteFeed && (
        <button
          type="button"
          aria-label="오늘 활동 기록하기"
          onClick={() => navigate('/checkin/write')}
          className={`fixed right-5 z-40 w-16 h-16 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:opacity-90 active:opacity-80 active:scale-95 transition-[opacity,transform] md:w-32 md:h-24 md:rounded-2xl md:flex-col md:gap-1 ${isScrolledDown ? 'md:flex' : 'md:hidden'}`}
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
            background: grad,
            boxShadow: '0 4px 20px oklch(0.62 0.13 220 / 0.35)',
            touchAction: 'manipulation',
            '--tw-ring-color': main,
          } as React.CSSProperties}
        >
          <PenLine size={22} className="text-white" aria-hidden="true" />
          <span className="hidden md:inline text-white font-bold text-base">기록하기</span>
        </button>
      )}
    </main>
  )
}
