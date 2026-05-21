import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BarChart2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_META } from '@/lib/categories'
import { useMyCalendar, useMyCheckins, useMyCategoryStats } from '@/hooks/useMyActivity'
import type { CalendarDayEntry, CategoryStats, CheckIn, Category } from '@/types'

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
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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

  const today = new Date().toISOString().slice(0, 10)

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

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">나의 활동</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/me/edit')}
            aria-label="프로필 편집"
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-base min-h-[48px] transition-colors [-webkit-tap-highlight-color:transparent]"
            style={{ background: 'oklch(0.62 0.15 220 / 0.1)', color: 'oklch(0.48 0.15 220)' }}
          >
            <Pencil size={18} aria-hidden="true" />
            프로필 편집
          </button>
          <button
            onClick={() => navigate('/me/report')}
            aria-label="월간 리포트 보기"
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-base min-h-[48px] transition-colors [-webkit-tap-highlight-color:transparent]"
            style={{ background: 'oklch(0.62 0.15 220 / 0.1)', color: 'oklch(0.48 0.15 220)' }}
          >
            <BarChart2 size={20} aria-hidden="true" />
            월간 리포트
          </button>
        </div>
      </div>

      {/* 캘린더 섹션 */}
      <section className="space-y-4">
        {/* 월 이동 헤더 */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevMonth}
            aria-label="이전 달로 이동"
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border text-lg font-bold text-foreground/60 hover:bg-accent min-h-[52px] transition-colors"
          >
            <ChevronLeft size={20} aria-hidden="true" />
            이전 달
          </button>
          <span className="text-2xl font-bold text-foreground">{currentYear}년 {currentMonth}월</span>
          <button
            onClick={nextMonth}
            aria-label="다음 달로 이동"
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border text-lg font-bold text-foreground/60 hover:bg-accent min-h-[52px] transition-colors"
          >
            다음 달
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-lg font-bold text-foreground/60 py-2">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dateStr, idx) => {
            if (!dateStr) return <div key={`empty-${idx}`} />
            const entry = calendarMap[dateStr]
            const hasActivity = !!entry
            const isSelected = selectedDate === dateStr
            const isToday = dateStr === today
            const dayNum = Number(dateStr.split('-')[2])

            return (
              <button
                key={dateStr}
                disabled={!hasActivity}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                aria-label={`${dateStr}, ${hasActivity ? `활동 ${entry.categories.length}개` : '활동 없음'}`}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-col items-center justify-start pt-1 pb-2 rounded-xl min-h-[72px] transition-colors focus-visible:ring-2 focus-visible:ring-primary',
                  hasActivity ? 'cursor-pointer hover:bg-primary/10' : 'cursor-default',
                  isSelected ? 'bg-primary/15 ring-2 ring-primary' : '',
                  isToday && !isSelected ? 'bg-accent' : '',
                )}
              >
                <span className={cn(
                  'text-lg font-semibold',
                  isToday ? 'text-primary font-bold' : '',
                  !hasActivity ? 'text-foreground/60' : 'text-foreground',
                )}>
                  {dayNum}
                </span>
                {hasActivity && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {entry.categories.slice(0, 3).map((_cat: Category, i: number) => (
                      <span key={i} className="w-3 h-3 rounded-full bg-primary/70" />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* 날짜별 체크인 목록 */}
      {selectedDate && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            {selectedDate.replace(/-/g, '.')} 활동 목록
          </h2>
          {(dateCheckins as CheckIn[]).length === 0 ? (
            <p className="text-lg font-semibold text-foreground/60 text-center py-4">이 날은 기록된 활동이 없어요</p>
          ) : (
            (dateCheckins as CheckIn[]).map((checkin) => {
              const { icon: Icon, label } = CATEGORY_META[checkin.category]
              return (
                <div key={checkin.id} className="rounded-2xl border border-border bg-card p-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon size={28} className="text-primary" aria-hidden="true" />
                    <span className="text-xl font-bold text-foreground">{label}</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{checkin.title}</p>
                  <p className="text-xl text-foreground">{checkin.description}</p>
                  {checkin.photoUrls && checkin.photoUrls.length > 0 && (
                    <img
                      src={checkin.photoUrls[0]}
                      alt={`${checkin.nickname}님의 ${label} 활동 사진`}
                      className="w-full rounded-lg object-cover max-h-48"
                    />
                  )}
                </div>
              )
            })
          )}
        </section>
      )}

      {/* 통계 섹션 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          {currentYear}년 {currentMonth}월 카테고리별 활동
        </h2>
        {currentMonthEntries.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-lg font-semibold text-foreground/60">
            이번 달은 아직 기록된 활동이 없어요. 오늘 첫 활동을 기록해 보세요!
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            {stats.map(({ category, count }) => {
              const { icon: Icon, label } = CATEGORY_META[category]
              return (
                <div key={category} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <Icon size={24} className="text-primary shrink-0" aria-hidden="true" />
                    <span className="text-xl font-bold truncate">{label}</span>
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xl font-bold text-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
