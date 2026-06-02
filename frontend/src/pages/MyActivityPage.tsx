import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BarChart2, Pencil, ShieldOff, Footprints, ChefHat, BookOpen, Sprout, Dumbbell, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_META } from '@/lib/categories'
import { useMyCalendar, useMyCheckins, useMyCategoryStats } from '@/hooks/useMyActivity'
import type { CalendarDayEntry, CategoryStats, CheckIn, Category } from '@/types'

// ─── 앱 테마 토큰 (CLAUDE.md 디자인 시스템) ──────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const serif = { fontFamily: "'Noto Serif KR', serif" }

// ─── 카테고리별 색상 (테마 계열 유지하되 카테고리 구분) ──────────
const CAT_COLORS: Record<Category, { bg: string; dot: string; text: string }> = {
  WALK:      { bg: 'oklch(0.95 0.05 160)', dot: 'oklch(0.52 0.15 160)', text: 'oklch(0.40 0.15 160)' },
  COOKING:   { bg: 'oklch(0.95 0.06 60)',  dot: 'oklch(0.62 0.18 55)',  text: 'oklch(0.48 0.18 55)'  },
  READING:   { bg: mA(0.10),               dot: main,                   text: dark                    },
  GARDENING: { bg: 'oklch(0.95 0.05 145)', dot: 'oklch(0.50 0.14 145)', text: 'oklch(0.38 0.14 145)' },
  EXERCISE:  { bg: 'oklch(0.95 0.05 350)', dot: 'oklch(0.55 0.18 350)', text: 'oklch(0.42 0.18 350)' },
  MEETING:   { bg: lA(0.15),               dot: light,                  text: dark                    },
  OTHER:     { bg: 'oklch(0.95 0.01 250)', dot: 'oklch(0.60 0.03 250)', text: 'oklch(0.45 0.03 250)' },
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function getCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const lastDate = new Date(year, month, 0).getDate()
  const days: (string | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= lastDate; d++) {
    days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return days
}

export default function MyActivityPage() {
  const navigate = useNavigate()
  const now = new Date()
  const today = new Date().toISOString().slice(0, 10)
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(today)

  const { data: calendarData = [] } = useMyCalendar(currentYear, currentMonth)
  const { data: dateCheckins = [] } = useMyCheckins(selectedDate ?? '')
  const { data: statsData = [] } = useMyCategoryStats(currentYear, currentMonth)

  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])

  const calendarMap = useMemo(() => {
    const map: Record<string, CalendarDayEntry> = {}
    ;(calendarData as CalendarDayEntry[]).forEach((entry) => { map[entry.date] = entry })
    return map
  }, [calendarData])

  const currentMonthEntries = useMemo(
    () => (calendarData as CalendarDayEntry[]).filter((e) =>
      e.date.startsWith(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
    ),
    [calendarData, currentYear, currentMonth],
  )

  const prevMonth = () => {
    setSelectedDate(null)
    if (currentMonth === 1) { setCurrentYear((y) => y - 1); setCurrentMonth(12) }
    else setCurrentMonth((m) => m - 1)
  }

  const nextMonth = () => {
    setSelectedDate(null)
    if (currentMonth === 12) { setCurrentYear((y) => y + 1); setCurrentMonth(1) }
    else setCurrentMonth((m) => m + 1)
  }

  const stats = statsData as CategoryStats[]
  const maxCount = stats.length > 0 ? Math.max(...stats.map((s) => s.count)) : 1
  const totalThisMonth = currentMonthEntries.length

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

      {/* ── 페이지 헤더 ── */}
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-bold tracking-widest uppercase mb-1"
              style={{ color: main, letterSpacing: '0.15em' }}
            >
              My Journal
            </p>
            <h1
              className="text-4xl font-black leading-tight whitespace-nowrap"
              style={{ ...serif, color: 'oklch(0.15 0 0)' }}
            >
              나의 활동
            </h1>
            {totalThisMonth > 0 && (
              <p className="mt-1 text-base font-medium text-foreground/60">
                이번 달{' '}
                <span className="font-bold" style={{ color: dark }}>
                  {totalThisMonth}일
                </span>{' '}
                기록했어요
              </p>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button
              onClick={() => navigate('/me/edit')}
              aria-label="프로필 편집"
              className="flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl font-bold text-sm text-white transition-all active:scale-95 [-webkit-tap-highlight-color:transparent]"
              style={{ background: grad }}
            >
              <Pencil size={15} aria-hidden="true" />
              <span>편집</span>
            </button>
            <button
              onClick={() => navigate('/me/report')}
              aria-label="월간 리포트"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all active:scale-95 [-webkit-tap-highlight-color:transparent]"
              style={{ background: mA(0.10), color: dark }}
            >
              <BarChart2 size={18} aria-hidden="true" />
            </button>
            <button
              onClick={() => navigate('/me/blocks')}
              aria-label="차단 목록"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all active:scale-95 [-webkit-tap-highlight-color:transparent]"
              style={{ background: mA(0.10), color: dark }}
            >
              <ShieldOff size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 구분선 — 테마 그라디언트 */}
        <div
          style={{
            height: 2,
            borderRadius: 1,
            background: `linear-gradient(90deg, ${main}, ${light} 50%, transparent)`,
          }}
        />
      </header>

      {/* ── 캘린더 ── */}
      <section
        className="rounded-3xl p-6 space-y-5 bg-card"
        style={{ border: `1px solid ${mA(0.12)}`, boxShadow: `0 2px 20px ${mA(0.07)}` }}
      >
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            aria-label="이전 달로 이동"
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors [-webkit-tap-highlight-color:transparent]"
            style={{ background: mA(0.10), color: dark }}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <span className="text-2xl font-black" style={{ ...serif, color: 'oklch(0.15 0 0)' }}>
            {currentYear}년 {currentMonth}월
          </span>

          <button
            onClick={nextMonth}
            aria-label="다음 달로 이동"
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors [-webkit-tap-highlight-color:transparent]"
            style={{ background: mA(0.10), color: dark }}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className="text-center text-xs font-bold py-1"
              style={{
                color: i === 0 ? 'oklch(0.55 0.18 25)' : i === 6 ? main : 'oklch(0.55 0 0)',
                letterSpacing: '0.05em',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map((dateStr, idx) => {
            if (!dateStr) return <div key={`empty-${idx}`} />
            const entry = calendarMap[dateStr]
            const hasActivity = !!entry
            const isSelected = selectedDate === dateStr
            const isToday = dateStr === today
            const dayNum = Number(dateStr.split('-')[2])
            const dayOfWeek = new Date(dateStr).getDay()

            return (
              <button
                key={dateStr}
                disabled={!hasActivity}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                aria-label={`${dateStr}, ${hasActivity ? `활동 ${entry.categories.length}개` : '활동 없음'}`}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-col items-center py-1.5 rounded-2xl transition-all [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2',
                )}
                style={{
                  background: isSelected
                    ? grad
                    : isToday
                      ? 'oklch(0.93 0 0)'
                      : 'transparent',
                  cursor: hasActivity ? 'pointer' : 'default',
                  minHeight: 56,
                }}
              >
                <span
                  className="text-base font-bold leading-none"
                  style={{
                    color: isSelected
                      ? '#fff'
                      : isToday
                        ? main
                        : dayOfWeek === 0
                          ? 'oklch(0.55 0.18 25)'
                          : dayOfWeek === 6
                            ? dark
                            : hasActivity
                              ? 'oklch(0.15 0 0)'
                              : 'oklch(0.75 0 0)',
                  }}
                >
                  {dayNum}
                </span>

                {/* 카테고리 dot */}
                {hasActivity && (
                  <div className="flex gap-0.5 mt-1">
                    {entry.categories.slice(0, 3).map((cat: Category, i: number) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : CAT_COLORS[cat].dot }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 카테고리 범례 */}
        {totalThisMonth > 0 && (
          <div
            className="flex flex-wrap gap-2 pt-3"
            style={{ borderTop: `1px solid ${mA(0.10)}` }}
          >
            {Object.entries(CAT_COLORS)
              .filter(([cat]) => stats.some((s) => s.category === cat))
              .map(([cat, colors]) => {
                const meta = CATEGORY_META[cat as Category]
                return (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
                    {meta.shortLabel}
                  </span>
                )
              })}
          </div>
        )}
      </section>

      {/* ── 선택 날짜 체크인 목록 ── */}
      {selectedDate && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              style={{ width: 3, height: 22, background: grad, borderRadius: 2 }}
            />
            <h2 className="text-lg font-black" style={{ ...serif, color: 'oklch(0.15 0 0)' }}>
              {selectedDate.replace(/-/g, '.')}
            </h2>
          </div>

          {(dateCheckins as CheckIn[]).length === 0 ? (
            <p
              className="text-base font-medium text-center py-6 rounded-2xl bg-card"
              style={{ color: 'oklch(0.55 0 0)', border: `1px solid ${mA(0.10)}`, wordBreak: 'keep-all' }}
            >
              이 날은 기록된 활동이 없어요
            </p>
          ) : (
            (dateCheckins as CheckIn[]).map((checkin) => {
              const { icon: Icon, label } = CATEGORY_META[checkin.category]
              const colors = CAT_COLORS[checkin.category]
              return (
                <Link
                  key={checkin.id}
                  to={`/checkin/${checkin.id}`}
                  className="block rounded-2xl p-5 space-y-2 bg-card transition-all hover:-translate-y-0.5 [-webkit-tap-highlight-color:transparent]"
                  style={{
                    border: `1px solid ${mA(0.10)}`,
                    boxShadow: `0 1px 8px ${mA(0.05)}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-xl"
                      style={{ background: colors.bg }}
                    >
                      <Icon size={18} aria-hidden="true" style={{ color: colors.dot }} />
                    </span>
                    <span className="text-sm font-bold" style={{ color: colors.text }}>{label}</span>
                  </div>
                  <p
                    className="text-lg font-bold leading-snug text-foreground"
                    style={{ wordBreak: 'keep-all' }}
                  >
                    {checkin.title}
                  </p>
                  {checkin.description && (
                    <p
                      className="text-base leading-relaxed text-foreground/60"
                      style={{ wordBreak: 'keep-all' }}
                    >
                      {checkin.description}
                    </p>
                  )}
                  {checkin.photoUrls && checkin.photoUrls.length > 0 && (
                    <img
                      src={checkin.photoUrls[0]}
                      alt={`${checkin.nickname}님의 ${label} 활동 사진`}
                      className="w-full rounded-xl object-cover"
                      style={{ maxHeight: 200 }}
                    />
                  )}
                </Link>
              )
            })
          )}
        </section>
      )}

      {/* ── 카테고리 통계 ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            style={{ width: 3, height: 22, background: grad, borderRadius: 2 }}
          />
          <h2 className="text-lg font-black" style={{ ...serif, color: 'oklch(0.15 0 0)' }}>
            {currentMonth}월 활동 통계
          </h2>
        </div>

        {currentMonthEntries.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center space-y-4 bg-card"
            style={{ border: `1px solid ${mA(0.10)}` }}
          >
            <div className="flex justify-center gap-3 opacity-20">
              {[Footprints, ChefHat, BookOpen, Sprout, Dumbbell, Users, MoreHorizontal].map((Icon, i) => (
                <Icon key={i} size={28} style={{ color: main }} aria-hidden="true" />
              ))}
            </div>
            <p
              className="text-base font-semibold text-foreground/60"
              style={{ wordBreak: 'keep-all' }}
            >
              이번 달 아직 활동 기록이 없어요
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-base min-h-[48px] text-white transition-all hover:opacity-90 active:scale-95 [-webkit-tap-highlight-color:transparent]"
              style={{ background: grad }}
            >
              첫 활동 기록하기
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 space-y-5 bg-card"
            style={{ border: `1px solid ${mA(0.10)}`, boxShadow: `0 1px 8px ${mA(0.05)}` }}
          >
            {stats.map(({ category, count }) => {
              const { icon: Icon, label } = CATEGORY_META[category]
              const colors = CAT_COLORS[category]
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center justify-center w-7 h-7 rounded-lg"
                        style={{ background: colors.bg }}
                      >
                        <Icon size={15} aria-hidden="true" style={{ color: colors.dot }} />
                      </span>
                      <span className="text-base font-bold text-foreground">{label}</span>
                    </div>
                    <span className="text-base font-black tabular-nums" style={{ color: dark }}>
                      {count}
                      <span className="text-sm font-semibold ml-0.5 text-foreground/50">회</span>
                    </span>
                  </div>
                  <div
                    className="rounded-full overflow-hidden"
                    style={{ height: 7, background: mA(0.10) }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: colors.dot }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="h-4" />
    </div>
  )
}
