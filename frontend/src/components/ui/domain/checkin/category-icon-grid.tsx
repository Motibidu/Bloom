import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/categories'
import type { Category } from '@/types'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

interface Props {
  selected: Category | null
  onSelect: (category: Category) => void
}

export default function CategoryIconGrid({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-3">
      {CATEGORY_ORDER.map((cat) => {
        const { icon: Icon, label, shortLabel } = CATEGORY_META[cat]
        const isSelected = selected === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            aria-pressed={isSelected}
            aria-label={`${label} 카테고리${isSelected ? ', 선택됨' : ''}`}
            className="flex flex-col items-center justify-center gap-1 sm:gap-2 min-h-[76px] sm:min-h-[88px] rounded-2xl border-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={isSelected ? {
              background: mA(0.10),
              borderColor: mA(0.55),
              boxShadow: `0 0 0 2px ${mA(0.55)}`,
              color: dark,
            } : {
              background: 'white',
              borderColor: mA(0.15),
              color: dark,
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = mA(0.05) }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'white' }}
          >
            <Icon size={28} className="sm:hidden" aria-hidden="true" />
            <Icon size={40} className="hidden sm:block" aria-hidden="true" />
            <span className="sm:hidden text-xs font-bold text-center leading-tight">{shortLabel}</span>
            <span className="hidden sm:block text-lg font-bold text-center leading-tight" style={{ wordBreak: 'keep-all' }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
