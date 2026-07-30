import { useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import PhotoFeedCard from '@/components/ui/domain/checkin/photo-feed-card'
import { useInfiniteTodayFeed } from '@/hooks/useCheckin'
import type { CheckIn } from '@/types'

const main = 'oklch(0.62 0.15 220)'
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

  const loadedPageCount = infiniteFeed?.pages?.length ?? 0
  const photoCheckins = ((infiniteFeed?.pages ?? []).flatMap((p) => p.checkins).filter(Boolean) as CheckIn[])
    .filter((c) => (c.photoUrls?.length ?? 0) > 0)

  // 사진 없는 레거시 기록이 페이지를 가득 채워 필터링 후 0개가 되는 경우,
  // sentinel이 보이지 않는 빈 상태에 갇히지 않도록 자동으로 다음 페이지를 가져온다.
  useEffect(() => {
    if (
      photoCheckins.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage &&
      loadedPageCount > 0
    ) {
      fetchNextPage()
    }
  }, [photoCheckins.length, hasNextPage, isFetchingNextPage, loadedPageCount, fetchNextPage])

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

  const checkins = photoCheckins

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
          {!hasNextPage && checkins.length > 0 && (
            <p className="text-center text-sm font-semibold py-4" style={{ color: mA(0.45) }}>
              모든 사진을 확인했어요
            </p>
          )}
        </>
      )}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />
    </main>
  )
}
