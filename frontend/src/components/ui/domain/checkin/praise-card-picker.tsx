const main  = 'oklch(0.62 0.15 220)'

const PRAISE_CARDS: Array<{
  type: string
  emoji: string
  label: string
  subText: string
  bg: string
  color: string
  subTextColor: string
  borderColor: string
  selectedBorder: string
}> = [
  {
    type: 'GREAT_JOB',
    emoji: '🏆',
    label: '정말 잘하셨어요!',
    subText: '대단한 활동이에요',
    bg: 'oklch(0.96 0.08 80)',
    color: 'oklch(0.45 0.15 80)',
    subTextColor: 'oklch(0.38 0.12 80)',
    borderColor: 'oklch(0.88 0.10 80)',
    selectedBorder: 'oklch(0.65 0.18 80)',
  },
  {
    type: 'KEEP_IT_UP',
    emoji: '🌱',
    label: '계속 하세요!',
    subText: '꾸준함이 힘이에요',
    bg: 'oklch(0.96 0.07 150)',
    color: 'oklch(0.38 0.14 150)',
    subTextColor: 'oklch(0.32 0.11 150)',
    borderColor: 'oklch(0.88 0.09 150)',
    selectedBorder: 'oklch(0.55 0.17 150)',
  },
  {
    type: 'IMPRESSIVE',
    emoji: '✨',
    label: '대단해요!',
    subText: '정말 멋진 활동이네요',
    bg: 'oklch(0.95 0.08 290)',
    color: 'oklch(0.42 0.18 290)',
    subTextColor: 'oklch(0.35 0.14 290)',
    borderColor: 'oklch(0.87 0.10 290)',
    selectedBorder: 'oklch(0.58 0.20 290)',
  },
  {
    type: 'HEALTHY',
    emoji: '💪',
    label: '건강하게 사세요!',
    subText: '건강이 최고예요',
    bg: 'oklch(0.96 0.07 200)',
    color: 'oklch(0.40 0.13 200)',
    subTextColor: 'oklch(0.33 0.10 200)',
    borderColor: 'oklch(0.88 0.09 200)',
    selectedBorder: 'oklch(0.56 0.16 200)',
  },
  {
    type: 'INSPIRING',
    emoji: '🌸',
    label: '저도 해볼게요!',
    subText: '좋은 자극이 됐어요',
    bg: 'oklch(0.96 0.07 350)',
    color: 'oklch(0.42 0.15 350)',
    subTextColor: 'oklch(0.36 0.12 350)',
    borderColor: 'oklch(0.88 0.09 350)',
    selectedBorder: 'oklch(0.62 0.19 350)',
  },
]

interface PraiseCardPickerProps {
  selectedCard: string | null
  onSelect: (type: string) => void
}

export default function PraiseCardPicker({ selectedCard, onSelect }: PraiseCardPickerProps) {
  return (
    <div className="space-y-3">
      <p
        className="text-base font-bold"
        style={{ color: `oklch(0.55 0.06 220)` }}
      >
        보낼 칭찬 카드를 골라보세요
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRAISE_CARDS.map((card) => {
          const isSelected = selectedCard === card.type
          return (
            <button
              key={card.type}
              type="button"
              onClick={() => onSelect(card.type)}
              aria-pressed={isSelected}
              aria-label={`${card.label} 칭찬 카드${isSelected ? ' — 선택됨' : ''}`}
              className="relative flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
              style={{
                minHeight: '68px',
                background: card.bg,
                border: isSelected
                  ? `2px solid ${card.selectedBorder}`
                  : `1.5px dashed ${card.borderColor}`,
                boxShadow: isSelected
                  ? `0 4px 16px ${card.selectedBorder.replace(')', ' / 0.25)')}, 0 1px 4px ${card.selectedBorder.replace(')', ' / 0.15)')}`
                  : '0 1px 4px oklch(0 0 0 / 0.05)',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                opacity: isSelected ? 1 : 0.90,
                transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                '--tw-ring-color': main,
              } as React.CSSProperties}
            >
              {/* 이모지 */}
              <span
                className="text-3xl leading-none shrink-0"
                style={{
                  filter: isSelected
                    ? 'drop-shadow(0 2px 4px oklch(0 0 0 / 0.15))'
                    : 'none',
                  transition: 'filter 0.18s ease',
                }}
                aria-hidden="true"
              >
                {card.emoji}
              </span>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-base font-black leading-snug whitespace-nowrap"
                  style={{ color: card.color }}
                >
                  {card.label}
                </p>
                <p
                  className="text-sm font-medium leading-snug mt-0.5 whitespace-nowrap"
                  style={{ color: card.subTextColor }}
                >
                  {card.subText}
                </p>
              </div>

              {/* 선택 체크마크 */}
              {isSelected && (
                <div
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: card.selectedBorder,
                    animation: 'checkIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                  }}
                  aria-hidden="true"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes checkIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes checkIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
      `}</style>
    </div>
  )
}

export { PRAISE_CARDS }
export type { PraiseCardPickerProps }
