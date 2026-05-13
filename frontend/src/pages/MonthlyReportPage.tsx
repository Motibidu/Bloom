import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, Calendar, Activity, TrendingUp, Share2 } from 'lucide-react'
import { useMonthlyReport } from '@/hooks/useMyActivity'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/categories'
import type { Category } from '@/types'

/* ── 디자인 토큰 ──────────────────────────────────────────────── */
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mainA  = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lightA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const gradientBg = `linear-gradient(135deg, ${main}, ${light})`
const serifStyle: React.CSSProperties = { fontFamily: "'Noto Serif KR', serif" }

/* ── 유틸 ─────────────────────────────────────────────────────── */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

/* ── 통계 카드 컴포넌트 ──────────────────────────────────────── */
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  highlight?: boolean
}

function StatCard({ icon, label, value, unit, highlight }: StatCardProps) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl p-5 flex flex-col gap-2"
      style={
        highlight
          ? { background: gradientBg, boxShadow: `0 8px 32px ${mainA(0.25)}` }
          : { background: 'white', border: `1.5px solid ${mainA(0.15)}`, boxShadow: `0 4px 16px ${mainA(0.08)}` }
      }
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={highlight ? { background: 'rgba(255,255,255,0.25)' } : { background: mainA(0.1) }}
      >
        <span style={{ color: highlight ? 'white' : dark }}>{icon}</span>
      </div>
      <div>
        <p
          className="text-base font-bold leading-tight"
          style={{ color: highlight ? 'rgba(255,255,255,0.85)' : 'oklch(0.55 0.04 220)' }}
        >
          {label}
        </p>
        <p
          className="text-3xl font-black leading-none mt-1"
          style={{ color: highlight ? 'white' : dark, ...serifStyle }}
        >
          {value}
          <span
            className="text-lg font-bold ml-1"
            style={{ color: highlight ? 'rgba(255,255,255,0.75)' : mainA(0.7) }}
          >
            {unit}
          </span>
        </p>
      </div>
    </div>
  )
}

/* ── 메인 페이지 ─────────────────────────────────────────────── */
export default function MonthlyReportPage() {
  const navigate = useNavigate()
  const shareCardRef = useRef<HTMLDivElement>(null)
  const [isSharing, setIsSharing] = useState(false)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const isFutureMonth =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month > now.getMonth() + 1)

  const { data, isLoading } = useMonthlyReport(year, month)

  const handleShare = async () => {
    if (!shareCardRef.current || isSharing) return
    setIsSharing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(shareCardRef.current, {
        background: '#ffffff',
        scale: 2,
        useCORS: true,
      } as any)
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `bloom-${year}-${String(month).padStart(2, '0')}-report.png`
      link.click()
    } catch {
      // 공유 실패 시 조용히 처리
    } finally {
      setIsSharing(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (isFutureMonth) return
    if (isCurrentMonth) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  /* 달력 계산 */
  const totalDaysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)
  const activeDaySet = new Set(data?.activeDays ?? [])

  /* 카테고리 통계 */
  const categoryStats = data?.categoryStats ?? {}
  const sortedCategories = CATEGORY_ORDER.filter(cat => (categoryStats[cat] ?? 0) > 0)
  const maxCount = sortedCategories.length > 0
    ? Math.max(...sortedCategories.map(c => categoryStats[c] ?? 0))
    : 1

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 space-y-8">

      {/* ── 뒤로가기 + 타이틀 ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/me')}
          aria-label="나의 활동으로 돌아가기"
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors [-webkit-tap-highlight-color:transparent]"
          style={{ background: mainA(0.08) }}
        >
          <ChevronLeft size={24} style={{ color: dark }} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-black" style={{ color: dark, ...serifStyle }}>
          월간 리포트
        </h1>
      </div>

      {/* ── 월 선택 네비게이터 ── */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{ background: mainA(0.06), border: `1.5px solid ${mainA(0.12)}` }}
      >
        <button
          onClick={prevMonth}
          aria-label="이전 달"
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors [-webkit-tap-highlight-color:transparent]"
          style={{ background: mainA(0.1) }}
        >
          <ChevronLeft size={22} style={{ color: dark }} aria-hidden="true" />
        </button>

        <div className="text-center">
          <p className="text-xl font-black" style={{ color: dark, ...serifStyle }}>
            {year}년 {month}월
          </p>
          {isCurrentMonth && (
            <span
              className="text-sm font-bold px-3 py-0.5 rounded-full"
              style={{ background: mainA(0.15), color: dark }}
            >
              이번 달
            </span>
          )}
        </div>

        <button
          onClick={nextMonth}
          disabled={isCurrentMonth || isFutureMonth}
          aria-label="다음 달"
          aria-disabled={isCurrentMonth || isFutureMonth}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors [-webkit-tap-highlight-color:transparent] disabled:opacity-30"
          style={{ background: mainA(0.1) }}
        >
          <ChevronRight size={22} style={{ color: dark }} aria-hidden="true" />
        </button>
      </div>

      {/* ── 로딩 상태 ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: `${mainA(0.2)} ${mainA(0.2)} ${mainA(0.2)} ${main}` }}
            aria-label="데이터 불러오는 중"
          />
          <p className="text-lg font-bold" style={{ color: mainA(0.6) }}>불러오는 중...</p>
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* ── 공유 카드 캡처 영역 ── */}
          <div ref={shareCardRef} className="space-y-8">

          {/* ── 연속 활동 배너 ── */}
          {(data.currentStreak > 0) && (
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{
                background: `linear-gradient(135deg, oklch(0.55 0.18 35), oklch(0.68 0.18 42))`,
                boxShadow: '0 8px 24px oklch(0.55 0.18 35 / 0.25)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <Flame size={28} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-bold text-white/80">현재 연속 활동</p>
                <p className="text-2xl font-black text-white" style={serifStyle}>
                  {data.currentStreak}일 연속 중!
                </p>
              </div>
            </div>
          )}

          {/* ── 핵심 숫자 카드 3개 ── */}
          <div className="flex gap-3">
            <StatCard
              icon={<Calendar size={20} aria-hidden="true" />}
              label="활동한 날"
              value={data.totalDays}
              unit="일"
            />
            <StatCard
              icon={<Activity size={20} aria-hidden="true" />}
              label="총 체크인"
              value={data.totalCheckins}
              unit="회"
              highlight
            />
            <StatCard
              icon={<TrendingUp size={20} aria-hidden="true" />}
              label="최장 연속"
              value={data.longestStreak}
              unit="일"
            />
          </div>

          {/* ── 달력 히트맵 ── */}
          <section>
            <h2 className="text-xl font-black mb-4" style={{ color: dark, ...serifStyle }}>
              활동 달력
            </h2>
            <div
              className="rounded-2xl p-5"
              style={{ background: 'white', border: `1.5px solid ${mainA(0.12)}`, boxShadow: `0 4px 16px ${mainA(0.06)}` }}
            >
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-3">
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={d}
                    className="text-center text-base font-bold py-1"
                    style={{ color: i === 0 ? 'oklch(0.60 0.15 30)' : i === 6 ? dark : 'oklch(0.55 0.04 220)' }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-y-2">
                {/* 첫 주 빈 칸 */}
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* 날짜 셀 */}
                {Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map(day => {
                  const isActive = activeDaySet.has(day)
                  const isToday =
                    isCurrentMonth && day === now.getDate()

                  return (
                    <div key={day} className="flex items-center justify-center aspect-square">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={
                          isActive
                            ? { background: gradientBg, boxShadow: `0 2px 8px ${mainA(0.3)}` }
                            : isToday
                            ? { background: mainA(0.12), border: `2px solid ${main}` }
                            : {}
                        }
                      >
                        <span
                          className="text-base font-bold leading-none"
                          style={{
                            color: isActive
                              ? 'white'
                              : isToday
                              ? dark
                              : 'oklch(0.65 0.04 220)',
                          }}
                        >
                          {day}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 범례 */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: mainA(0.1) }}>
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ background: gradientBg }}
                  aria-hidden="true"
                />
                <span className="text-base font-bold" style={{ color: 'oklch(0.55 0.04 220)' }}>
                  활동한 날
                </span>
                <span className="text-base font-semibold ml-2" style={{ color: dark }}>
                  총 {data.totalDays}일
                </span>
              </div>
            </div>
          </section>

          {/* ── 카테고리별 막대 차트 ── */}
          <section>
            <h2 className="text-xl font-black mb-4" style={{ color: dark, ...serifStyle }}>
              카테고리별 활동
            </h2>

            {sortedCategories.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: mainA(0.05), border: `1.5px solid ${mainA(0.1)}` }}
              >
                <p className="text-lg font-bold" style={{ color: mainA(0.5) }}>
                  이번 달은 아직 기록된 활동이 없어요.
                </p>
                <p className="text-base font-semibold mt-1" style={{ color: mainA(0.4) }}>
                  오늘 첫 활동을 기록해 보세요!
                </p>
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 space-y-5"
                style={{
                  background: 'white',
                  border: `1.5px solid ${mainA(0.12)}`,
                  boxShadow: `0 4px 16px ${mainA(0.06)}`,
                }}
              >
                {sortedCategories.map(cat => {
                  const count = categoryStats[cat] ?? 0
                  const total = data.totalCheckins || 1
                  const pct = Math.round((count / maxCount) * 100)
                  const ratio = Math.round((count / total) * 100)
                  const isMost = cat === data.mostActiveCategory
                  const { icon: Icon, label } = CATEGORY_META[cat as Category]

                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={
                              isMost
                                ? { background: gradientBg }
                                : { background: mainA(0.1) }
                            }
                          >
                            <Icon
                              size={18}
                              style={{ color: isMost ? 'white' : dark }}
                              aria-hidden="true"
                            />
                          </div>
                          <span
                            className="text-base font-bold"
                            style={{ color: dark }}
                          >
                            {label}
                          </span>
                          {isMost && (
                            <span
                              className="text-sm font-bold px-2 py-0.5 rounded-full"
                              style={{ background: mainA(0.12), color: dark }}
                            >
                              최다
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black" style={{ color: dark }}>
                            {count}
                          </span>
                          <span className="text-base font-bold ml-0.5" style={{ color: mainA(0.6) }}>
                            회
                          </span>
                          <span className="text-sm font-semibold ml-2" style={{ color: 'oklch(0.65 0.04 220)' }}>
                            {ratio}%
                          </span>
                        </div>
                      </div>

                      {/* 막대 */}
                      <div
                        className="relative h-3 rounded-full overflow-hidden"
                        style={{ background: mainA(0.1) }}
                        role="progressbar"
                        aria-valuenow={count}
                        aria-valuemax={maxCount}
                        aria-label={`${label} ${count}회`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: isMost ? gradientBg : `linear-gradient(90deg, ${lightA(0.7)}, ${mainA(0.85)})`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          </div>{/* end shareCardRef */}

          {/* ── 공유하기 버튼 ── */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            aria-label="이달의 리포트 이미지로 저장하기"
            className="w-full min-h-[56px] rounded-2xl flex items-center justify-center gap-3 text-lg font-bold transition-opacity disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
            style={{ background: gradientBg, color: 'white', boxShadow: `0 6px 20px ${mainA(0.3)}` }}
          >
            <Share2 size={22} aria-hidden="true" />
            {isSharing ? '저장 중...' : '리포트 이미지로 저장'}
          </button>
        </>
      )}

      {/* ── 데이터 없음 (활동 없는 달) ── */}
      {!isLoading && !data && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: mainA(0.04), border: `1.5px solid ${mainA(0.1)}` }}
        >
          <p className="text-xl font-bold" style={{ color: mainA(0.5) }}>
            데이터를 불러올 수 없어요.
          </p>
        </div>
      )}
    </div>
  )
}
