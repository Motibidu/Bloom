const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad = `linear-gradient(135deg, ${main}, ${light})`

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  QNA: '질문공간',
  INFO: '정보공유',
}

interface Props {
  value: string | null
  onChange: (value: string | null) => void
}

export default function PostCategoryTabs({ value, onChange }: Props) {
  const options: (string | null)[] = [null, 'FREE', 'QNA', 'INFO']
  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 py-3"
      role="tablist"
      aria-label="게시판 카테고리"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {options.map(opt => {
        const selected = value === opt
        return (
          <button
            key={opt ?? 'all'}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt)}
            className="inline-flex items-center justify-center shrink-0 min-h-[48px] px-5 rounded-full text-base font-bold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={selected
              ? { background: grad, color: 'white', '--tw-ring-color': main } as React.CSSProperties
              : { background: mA(0.07), color: dark, '--tw-ring-color': main } as React.CSSProperties}
          >
            {opt === null ? '전체' : CATEGORY_LABELS[opt]}
          </button>
        )
      })}
    </div>
  )
}
