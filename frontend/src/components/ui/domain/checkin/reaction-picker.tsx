import { useEffect, useRef, useState } from 'react'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

const REACTIONS: Record<string, { emoji: string; label: string }> = {
  LIKE:      { emoji: '👍', label: '좋아요' },
  DELICIOUS: { emoji: '😋', label: '맛있겠다' },
  GREAT:     { emoji: '✨', label: '대단해요' },
  ENVIOUS:   { emoji: '🥹', label: '부럽다' },
  WELL_DONE: { emoji: '👏', label: '잘했어요' },
}

interface ReactionPickerProps {
  checkinId: number
  myReactionType: string | null
  reactionCounts: Record<string, number>
  onReact: (reactionType: string) => void
  disabled?: boolean
}

export default function ReactionPicker({
  myReactionType,
  reactionCounts,
  onReact,
  disabled,
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 팝오버 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  const totalCount = Object.values(reactionCounts).reduce((a, b) => a + b, 0)
  const myReaction = myReactionType ? REACTIONS[myReactionType] : null

  const handleReact = (type: string) => {
    onReact(type)
    setOpen(false)
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
    >
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen(v => !v) }}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={myReaction ? `내 리액션: ${myReaction.label}. 리액션 변경` : '리액션 선택'}
        className="flex items-center gap-1.5 rounded-xl px-2 transition-transform active:scale-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
        style={{
          minHeight: '48px',
          color: myReaction ? dark : 'oklch(0.55 0.05 220)',
          '--tw-ring-color': main,
        } as React.CSSProperties}
      >
        {myReaction ? (
          <>
            <span
              className="text-2xl leading-none"
              style={{
                filter: 'drop-shadow(0 1px 2px oklch(0 0 0 / 0.15))',
              }}
              aria-hidden="true"
            >
              {myReaction.emoji}
            </span>
            {totalCount > 0 && (
              <span
                className="text-base font-black"
                style={{ color: dark }}
              >
                {totalCount}
              </span>
            )}
          </>
        ) : (
          <>
            {/* 비활성 상태: 이모지 아이콘 + 카운트 */}
            <span
              className="text-xl leading-none"
              style={{ opacity: 0.45 }}
              aria-hidden="true"
            >
              👍
            </span>
            {totalCount > 0 && (
              <span
                className="text-base font-bold"
                style={{ color: 'oklch(0.55 0.05 220)' }}
              >
                {totalCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* 팝오버 */}
      {open && (
        <div
          role="dialog"
          aria-label="리액션 선택"
          className="absolute bottom-full left-0 mb-2 z-50"
          style={{
            filter: 'drop-shadow(0 8px 24px oklch(0 0 0 / 0.12))',
            animation: 'reactionPopIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 팝오버 카드 */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'white',
              border: `1.5px solid ${mA(0.12)}`,
              padding: '8px 6px',
              display: 'flex',
              gap: '4px',
            }}
          >
            {Object.entries(REACTIONS).map(([type, { emoji, label }]) => {
              const isActive = myReactionType === type
              const count = reactionCounts[type] ?? 0
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleReact(type)}
                  aria-label={`${label} ${count > 0 ? `(${count}명)` : ''} ${isActive ? '— 선택됨' : ''}`}
                  aria-pressed={isActive}
                  className="flex flex-col items-center gap-0.5 rounded-xl transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 [-webkit-tap-highlight-color:transparent]"
                  style={{
                    minHeight: '64px',
                    minWidth: '52px',
                    padding: '6px 4px',
                    background: isActive ? grad : 'transparent',
                    '--tw-ring-color': main,
                    transition: 'background 0.15s ease, transform 0.1s ease',
                  } as React.CSSProperties}
                >
                  <span
                    className="text-2xl leading-none"
                    style={{
                      filter: isActive
                        ? 'brightness(1.1) drop-shadow(0 2px 4px oklch(0 0 0 / 0.2))'
                        : 'none',
                      transition: 'filter 0.15s ease',
                    }}
                    aria-hidden="true"
                  >
                    {emoji}
                  </span>
                  <span
                    className="text-xs font-bold leading-none"
                    style={{
                      color: isActive ? 'white' : dark,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </span>
                  {count > 0 && (
                    <span
                      className="text-xs font-black leading-none"
                      style={{
                        color: isActive ? 'rgba(255,255,255,0.85)' : mA(0.6),
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 말풍선 꼬리 */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-7px',
              left: '22px',
              width: '14px',
              height: '14px',
              background: 'white',
              border: `1.5px solid ${mA(0.12)}`,
              transform: 'rotate(45deg)',
              borderTop: 'none',
              borderLeft: 'none',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes reactionPopIn {
          from { opacity: 0; transform: scale(0.85) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
