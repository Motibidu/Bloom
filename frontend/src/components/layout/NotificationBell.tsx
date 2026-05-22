import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MessageCircle, Heart, CheckCheck } from 'lucide-react'
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  type AppNotification,
} from '@/hooks/useNotifications'

// ── 색상 토큰 ──────────────────────────────────────────────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const red   = 'oklch(0.55 0.18 25)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

// ── 상대 시간 포매터 ──────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

// ── 알림 행 ───────────────────────────────────────────────────────────────
function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification
  onRead: (n: SseNotification) => void
}) {
  const Icon = notification.type === 'LIKE' ? Heart : MessageCircle

  return (
    <button
      type="button"
      aria-label={`${notification.message} — ${relativeTime(notification.createdAt)}`}
      onClick={() => onRead(notification)}
      className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
      style={{
        background: notification.isRead ? 'transparent' : mA(0.05),
        minHeight: '56px',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = mA(0.08) }}
      onMouseLeave={e => { e.currentTarget.style.background = notification.isRead ? 'transparent' : mA(0.05) }}
    >
      {/* 아이콘 */}
      <div
        className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: notification.type === 'LIKE'
            ? 'oklch(0.55 0.18 25 / 0.12)'
            : mA(0.12),
        }}
        aria-hidden="true"
      >
        <Icon
          size={15}
          style={{ color: notification.type === 'LIKE' ? red : main }}
        />
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-snug font-semibold text-foreground truncate"
          style={{ fontFamily: "'Nanum Gothic', sans-serif" }}
        >
          {notification.actorNickname}
        </p>
        <p
          className="text-sm text-muted-foreground leading-snug mt-0.5"
          style={{ fontFamily: "'Nanum Gothic', sans-serif" }}
        >
          {notification.message}
        </p>
        <time
          className="text-xs font-medium mt-1 block"
          style={{ color: mA(0.5) }}
          dateTime={notification.createdAt}
        >
          {relativeTime(notification.createdAt)}
        </time>
      </div>

      {/* 미읽음 점 */}
      {!notification.isRead && (
        <div
          className="mt-2 w-2 h-2 rounded-full shrink-0"
          style={{ background: red }}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()

  const { data: unreadData } = useUnreadCount()
  const { data: notifications = [] } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const unreadCount = unreadData?.count ?? 0

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleRead(n: AppNotification) {
    if (!n.isRead) {
      markAsRead.mutate(n.id)
    }
    setOpen(false)
    navigate(`/checkin/${n.checkinId}`)
  }

  function handleMarkAll() {
    markAllAsRead.mutate()
  }

  return (
    <div className="relative">
      {/* 벨 버튼 */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`알림${unreadCount > 0 ? ` (미읽음 ${unreadCount}개)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ background: open ? mA(0.10) : 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = mA(0.10) }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <Bell
          size={22}
          aria-hidden="true"
          style={{ color: open ? main : 'oklch(0.45 0.04 220)' }}
          className={open ? 'animate-[bellRing_0.4s_ease]' : ''}
        />
        {/* 미읽음 배지 */}
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black text-white leading-none px-1"
            style={{ background: red, boxShadow: `0 0 0 2px white` }}
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="알림 목록"
          className="absolute right-0 top-full mt-2 w-80 max-h-[420px] flex flex-col overflow-hidden z-50"
          style={{
            background: 'white',
            border: `1.5px solid ${mA(0.15)}`,
            borderRadius: '20px',
            boxShadow: `0 8px 40px ${mA(0.18)}, 0 2px 8px oklch(0 0 0 / 0.06)`,
            animation: 'dropIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-8px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes bellRing {
              0%,100% { transform: rotate(0); }
              20% { transform: rotate(-15deg); }
              40% { transform: rotate(12deg); }
              60% { transform: rotate(-8deg); }
              80% { transform: rotate(5deg); }
            }
          `}</style>

          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              borderBottom: `1px solid ${mA(0.10)}`,
              background: `linear-gradient(135deg, ${mA(0.05)}, oklch(0.76 0.12 220 / 0.06))`,
            }}
          >
            <div className="flex items-center gap-2">
              <Bell size={16} aria-hidden="true" style={{ color: main }} />
              <span
                className="text-base font-black text-foreground"
                style={{ fontFamily: "'Nanum Gothic', sans-serif" }}
              >
                알림
              </span>
              {unreadCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-black text-white"
                  style={{ background: red }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markAllAsRead.isPending}
                aria-label="모두 읽음 처리"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all min-h-[36px] [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                style={{ color: dark, background: mA(0.10) }}
                onMouseEnter={e => { e.currentTarget.style.background = mA(0.18) }}
                onMouseLeave={e => { e.currentTarget.style.background = mA(0.10) }}
              >
                <CheckCheck size={14} aria-hidden="true" />
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="overflow-y-auto flex-1" role="list">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: mA(0.08) }}
                  aria-hidden="true"
                >
                  <Bell size={24} style={{ color: mA(0.4) }} />
                </div>
                <p
                  className="text-base font-semibold text-muted-foreground"
                  style={{ fontFamily: "'Nanum Gothic', sans-serif" }}
                >
                  아직 알림이 없어요
                </p>
              </div>
            ) : (
              <div role="list">
                {notifications.map((n, i) => (
                  <div
                    key={n.id}
                    role="listitem"
                    style={i < notifications.length - 1 ? { borderBottom: `1px solid ${mA(0.07)}` } : {}}
                  >
                    <NotificationRow notification={n} onRead={handleRead} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
