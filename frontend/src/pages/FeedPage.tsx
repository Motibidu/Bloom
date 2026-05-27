import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScrollContainer } from '@/lib/scrollContext'
import { Users, X, ImagePlus, PenLine, ClipboardList, Zap, AlignLeft, ChevronRight, UserCheck } from 'lucide-react'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Input } from '@/components/ui/shadcn/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/shadcn/sheet'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import CategoryIconGrid from '@/components/ui/domain/checkin/category-icon-grid'
import BigButton from '@/components/ui/common/big-button'
import { useInfiniteTodayFeed, useCreateCheckin, usePhotoUploadUrl, useSameCategoryUsers, useDeleteCheckin } from '@/hooks/useCheckin'
import { useFollowToggle } from '@/hooks/useFollow'
import { useAuthStore } from '@/store/authStore'
import { AUTO_TITLES, CATEGORY_META } from '@/lib/categories'
import type { Category, ActivitySummaryItem } from '@/types'

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
  const scrollContainer = useScrollContainer()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLElement>(null)

  const [checkinMode, setCheckinMode] = useState<'simple' | 'detail'>(() => {
    return (localStorage.getItem('checkinMode') as 'simple' | 'detail') ?? 'simple'
  })
  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all')

  const [sameCategorySheetOpen, setSameCategorySheetOpen] = useState(false)

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

  const createCheckin = useCreateCheckin()
  const getUploadUrl = usePhotoUploadUrl()
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

  const handleModeToggle = () => {
    const next = checkinMode === 'simple' ? 'detail' : 'simple'
    setCheckinMode(next)
    localStorage.setItem('checkinMode', next)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedCategory(null)
    setTitle('')
    setContent('')
    setPhotoFiles([])
    setPhotoPreviews([])
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return
    const remaining = 3 - photoFiles.length
    const toAdd = selected.slice(0, remaining)
    setPhotoFiles(prev => [...prev, ...toAdd])
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!selectedCategory) return
    if (checkinMode === 'detail' && (!title.trim() || !content.trim())) return
    setIsSubmitting(true)
    try {
      const objectKeys: string[] = []
      for (const file of photoFiles) {
        const { uploadUrl, objectKey } = await getUploadUrl.mutateAsync({
          filename: file.name,
          contentType: file.type,
        })
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        objectKeys.push(objectKey)
      }
      await createCheckin.mutateAsync({
        category: selectedCategory,
        title: title.trim(),
        content: content.trim(),
        photoObjectKeys: objectKeys.length > 0 ? objectKeys : undefined,
        isSimple: checkinMode === 'simple',
      })
      handleCloseForm()
    } catch {
      // 에러는 각 mutation에서 처리됨
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── 로딩 ────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8">
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
      <main className="max-w-6xl mx-auto px-6 py-8">
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
    .filter((c: any) => !c.isSimple || c.userId === currentUser?.id)

  // 떠나기 직전 스크롤 위치 저장 (상세 진입 시 onNavigate에서 호출)
  const saveScroll = () => {
    if (restoringRef.current) return
    const el = scrollContainer?.current
    if (el) sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop))
  }

  return (
    <main className="max-w-6xl mx-auto px-6 pt-4 pb-8 sm:py-8 space-y-5 sm:space-y-8">

      {/* ── 인사말 헤더 ────────────────────────────────────────────────────── */}
      <header
        className="relative rounded-3xl px-5 sm:px-8 py-6 sm:py-8 flex items-center gap-4 sm:gap-6 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${mA(0.08)} 0%, ${lA(0.12)} 100%)`,
          border: `1px solid ${mA(0.15)}`,
        }}
      >
        {/* 배경 장식 orb */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${lA(0.25)}, transparent 70%)` }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-6 -left-4 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${mA(0.15)}, transparent 70%)` }}
          aria-hidden="true"
        />

        {/* 아이콘 */}
        <div
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 relative lp-float"
          style={{ background: grad }}
          aria-hidden="true"
        >
          <span className="text-2xl sm:text-3xl">☀️</span>
        </div>

        <div className="space-y-0.5 min-w-0 relative">
          <p className="text-sm sm:text-base font-bold" style={{ color: dark }}>
            {formatTodayKo()}
          </p>
          <h1 className="text-lg sm:text-2xl font-black text-foreground leading-snug">
            오늘도 좋은 하루 되세요!
          </h1>
          <p className="text-sm sm:text-base font-medium text-muted-foreground leading-relaxed">
            오늘 하루 어떤 활동을 하셨나요? 기록해 보세요.
          </p>
        </div>
      </header>

      {/* ── 참여 온도 ────────────────────────────────────────────────────── */}
      {totalCheckinCount > 0 && (
        <p
          className="text-base font-bold px-5 py-3 rounded-2xl w-fit whitespace-nowrap"
          style={{ background: mA(0.08), color: dark, border: `1px solid ${mA(0.18)}` }}
        >
          🌡️ {getParticipationMessage(totalCheckinCount)}
        </p>
      )}

      {/* ── 같은 카테고리 활동자 배너 ─────────────────────────────────────── */}
      {sameCategoryUserCount > 0 && (
        <button
          type="button"
          aria-label={`나와 같은 활동을 한 ${sameCategoryUserCount}명 보기`}
          onClick={() => {
            setSameCategorySheetOpen(true)
            fetchSameCategoryUsers()
          }}
          className="w-full rounded-2xl px-6 py-5 flex items-center gap-4 lp-badge-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(135deg, ${mA(0.10)}, ${lA(0.08)})`,
            border: `1px solid ${mA(0.20)}`,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: grad }}
            aria-hidden="true"
          >
            <Users size={22} className="text-white" />
          </div>

          <p className="text-lg font-bold leading-snug flex-1" style={{ color: dark }}>
            나와 같은 활동을 한{' '}
            <strong className="text-2xl" style={{ color: main }}>
              {sameCategoryUserCount}명
            </strong>
            이 있어요!
          </p>

          <ChevronRight size={22} className="shrink-0" style={{ color: light }} aria-hidden="true" />
        </button>
      )}

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
          className="rounded-2xl px-6 py-5 flex items-center gap-3"
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
      {canWriteFeed && (isFormOpen ? null : (
        <button
          type="button"
          aria-label="오늘 활동 기록하기"
          onClick={() => setIsFormOpen(true)}
          className="w-full rounded-2xl px-5 sm:px-7 py-5 sm:py-7 flex items-center gap-4 sm:gap-5 text-left min-h-[88px] sm:min-h-[108px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: grad,
            boxShadow: `0 4px 20px oklch(0.62 0.13 220 / 0.25)`,
            '--tw-ring-color': main,
          } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {/* 아이콘 박스 */}
          <div
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'oklch(1 0 0 / 0.18)' }}
            aria-hidden="true"
          >
            <PenLine size={22} className="text-white" />
          </div>

          <div className="space-y-1 min-w-0">
            <p className="text-lg sm:text-xl font-black text-white">오늘 활동 기록하기</p>
            <p className="text-sm sm:text-base font-semibold" style={{ color: 'oklch(1 0 0 / 0.75)' }}>
              탭해서 바로 시작하기
            </p>
          </div>

          <div
            className="ml-auto shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'oklch(1 0 0 / 0.18)' }}
            aria-hidden="true"
          >
            <span className="text-white text-lg font-black">→</span>
          </div>
        </button>
      ))}
      {canWriteFeed && isFormOpen && (
        <section
          ref={formRef}
          aria-label="활동 기록 작성"
          className="rounded-2xl bg-card px-7 py-7 space-y-6 shadow-sm"
          style={{ border: `2px solid ${mA(0.20)}` }}
        >
          {/* 폼 헤더 */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-foreground shrink-0">
              오늘 활동 기록하기
            </h2>
            <button
              type="button"
              onClick={handleCloseForm}
              aria-label="작성 취소하기"
              className="inline-flex items-center gap-1.5 min-h-[48px] min-w-[48px] px-3 rounded-xl text-base font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0"
              style={{ '--tw-ring-color': main } as React.CSSProperties}
            >
              <X size={20} aria-hidden="true" />
              <span>취소</span>
            </button>
          </div>

          {/* 구분선 */}
          <div
            className="h-px w-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${mA(0.30)}, ${lA(0.15)}, transparent)` }}
            aria-hidden="true"
          />

          {/* STEP 1 — 카테고리 선택 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black text-white shrink-0"
                  style={{ background: grad }}
                  aria-hidden="true"
                >
                  1
                </span>
                <p className="text-xl font-bold text-foreground">어떤 활동을 했나요?</p>
              </div>
              {/* 모드 토글 버튼 */}
              <button
                type="button"
                onClick={handleModeToggle}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 min-h-[48px]"
                style={{
                  color: dark,
                  background: mA(0.08),
                  '--tw-ring-color': main,
                } as React.CSSProperties}
                aria-pressed={checkinMode === 'detail'}
                aria-label={checkinMode === 'simple' ? '상세 모드로 전환' : '간편 모드로 전환'}
              >
                {checkinMode === 'simple' ? (
                  <>
                    <AlignLeft size={15} aria-hidden="true" />
                    <span>상세하게 쓰기</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} aria-hidden="true" />
                    <span>간편하게 쓰기</span>
                  </>
                )}
              </button>
            </div>
            <CategoryIconGrid selected={selectedCategory} onSelect={(cat) => {
              setSelectedCategory(cat)
              if (checkinMode === 'simple') {
                const autoTitle = AUTO_TITLES[cat]
                setTitle(autoTitle)
                setContent(autoTitle)
              }
            }} />
          </div>

          {/* 간편 모드 — 카테고리 선택 후 바로 등록 */}
          {checkinMode === 'simple' && (
            <div className="space-y-4">
              <div
                className="h-px w-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${mA(0.20)}, transparent)` }}
                aria-hidden="true"
              />
              {selectedCategory ? (
                <>
                  {/* 자동 제목 미리보기 */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                    style={{ background: mA(0.07), border: `1px solid ${mA(0.15)}` }}
                  >
                    <Zap size={20} style={{ color: main }} aria-hidden="true" className="shrink-0" />
                    <p className="text-base font-semibold text-muted-foreground leading-snug">
                      <span className="font-black" style={{ color: dark }}>'{AUTO_TITLES[selectedCategory]}'</span>
                      {' '}로 등록돼요
                    </p>
                  </div>
                  {/* 바로 등록 버튼 */}
                  <BigButton
                    fullWidth
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    aria-label={isSubmitting ? '등록하는 중이에요' : '바로 등록하기'}
                    onClick={handleSubmit}
                    className="h-16 text-xl font-black rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
                    style={btnPrimary}
                  >
                    {isSubmitting ? '등록하는 중이에요...' : '바로 등록하기'}
                  </BigButton>
                </>
              ) : (
                <p
                  className="text-center text-base font-semibold py-3"
                  style={{ color: mA(0.55) }}
                  aria-live="polite"
                >
                  위에서 카테고리를 선택해 주세요
                </p>
              )}
            </div>
          )}

          {/* STEP 2 — 제목 · 내용 · 사진 (상세 모드) */}
          {checkinMode === 'detail' && selectedCategory && (
            <div className="space-y-5">
              <div
                className="h-px w-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${mA(0.20)}, transparent)` }}
                aria-hidden="true"
              />

              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black text-white shrink-0"
                  style={{ background: grad }}
                  aria-hidden="true"
                >
                  2
                </span>
                <p className="text-xl font-bold text-foreground">활동을 설명해 주세요</p>
              </div>

              {/* 제목 입력 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="activity-title" className="text-lg font-bold text-foreground">
                    제목
                  </label>
                  <span className="text-base font-medium text-foreground/50" aria-live="polite">
                    {title.length}/30
                  </span>
                </div>
                <Input
                  id="activity-title"
                  className="text-lg px-4 py-3 rounded-xl border-2 h-auto focus-visible:ring-0"
                  style={title.length > 0 ? { borderColor: mA(0.45) } : undefined}
                  maxLength={30}
                  placeholder="활동 제목을 입력해 주세요"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* 내용 입력 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="activity-content" className="text-lg font-bold text-foreground">
                    내용
                  </label>
                  <span className="text-base font-medium text-foreground/50" aria-live="polite">
                    {content.length}/300
                  </span>
                </div>
                <Textarea
                  id="activity-content"
                  className="text-lg px-4 py-3 resize-none rounded-xl border-2 focus-visible:ring-0"
                  style={content.length > 0 ? { borderColor: mA(0.45) } : undefined}
                  rows={4}
                  maxLength={300}
                  placeholder="오늘 활동을 간단히 설명해 주세요"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* 사진 첨부 */}
              <div className="space-y-3">
                <p className="text-lg font-bold text-foreground">
                  사진 첨부{' '}
                  <span className="text-base font-medium text-muted-foreground">(선택, 최대 3장)</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {/* 썸네일 미리보기 */}
                {photoPreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="relative shrink-0 w-28 h-28 rounded-xl overflow-hidden">
                        <img
                          src={src}
                          alt={`첨부 사진 ${i + 1} 미리보기`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label={`${i + 1}번째 사진 제거`}
                          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <X size={14} className="text-white" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* 추가 버튼 — 3장 미만일 때만 표시 */}
                {photoPreviews.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-3 min-h-[68px] px-4 rounded-2xl border-2 border-dashed text-lg font-medium text-muted-foreground transition-all duration-200 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      borderColor: mA(0.22),
                      '--tw-ring-color': main,
                    } as React.CSSProperties}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = mA(0.45); e.currentTarget.style.background = mA(0.04) }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = mA(0.22); e.currentTarget.style.background = 'transparent' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: mA(0.10) }}
                      aria-hidden="true"
                    >
                      <ImagePlus size={20} style={{ color: main }} />
                    </div>
                    <span>사진 추가하기 ({photoPreviews.length}/3)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 등록 버튼 — 상세 모드 전용 */}
          {checkinMode === 'detail' && selectedCategory && (
            <BigButton
              fullWidth
              loading={isSubmitting}
              disabled={!title.trim() || !content.trim() || isSubmitting}
              aria-label={isSubmitting ? '등록하는 중이에요' : '활동 등록하기'}
              onClick={handleSubmit}
              className="h-16 text-xl font-black rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
              style={btnPrimary}
            >
              {isSubmitting ? '등록하는 중이에요...' : '등록하기'}
            </BigButton>
          )}
        </section>
      )}

      {/* ── 피드 목록 ────────────────────────────────────────────────────────── */}
      <section aria-label="오늘의 활동 피드">
        {/* 피드 탭 — 항상 표시 */}
        <div
          className="flex gap-2 mb-6"
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

        {/* 오늘 활동 집계 섹션 */}
        {activitySummary.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-bold mb-3" style={{ color: dark }}>오늘 함께 활동한 이웃</p>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
              {activitySummary.map((item: ActivitySummaryItem) => {
                const { icon: Icon, label } = CATEGORY_META[item.category]
                return (
                  <div
                    key={item.category}
                    className="shrink-0 snap-start flex items-center gap-2 px-4 rounded-2xl min-h-[52px]"
                    style={{ background: mA(0.08), border: `1px solid ${mA(0.15)}` }}
                  >
                    <Icon size={18} style={{ color: dark }} aria-hidden="true" />
                    <span className="text-base font-black" style={{ color: dark }}>{label}</span>
                    <span className="text-base font-bold" style={{ color: dark }}>{item.count}명</span>
                    {item.previewNicknames.length > 0 && (
                      <div className="flex -space-x-1.5 ml-1">
                        {item.previewNicknames.map((nick) => (
                          <div
                            key={nick}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ring-2 ring-white"
                            style={{ background: `linear-gradient(135deg, ${main}, ${light})` }}
                            aria-label={nick}
                          >
                            {nick[0]}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 섹션 헤더 */}
        <div className="flex items-center gap-4 mb-7">
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
                onClick={() => setIsFormOpen(true)}
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
          <div className="-mx-6 w-[calc(100%+3rem)] sm:mx-0 sm:w-full flex flex-col sm:gap-6">
            {checkins.map((checkin: any, idx: number) => (
              <React.Fragment key={checkin.id}>
                {idx > 0 && <div className="sm:hidden h-4" style={{ background: 'oklch(0.96 0.01 220)' }} aria-hidden="true" />}
                <FeedCheckinCard
                  checkin={checkin}
                  currentUserId={currentUser?.id}
                  canInteract={canWriteFeed}
                  onNavigate={() => { saveScroll(); navigate(`/checkin/${checkin.id}`) }}
                  onAlsoCheckin={() => {
                    setSelectedCategory(checkin.category as Category)
                    setIsFormOpen(true)
                    setTimeout(() => {
                      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 50)
                  }}
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
    </main>
  )
}
