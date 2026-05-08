import { cn } from '@/lib/utils'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/categories'
import type { Category } from '@/types'

interface Props {
  selected: Category | null
  onSelect: (category: Category) => void
}

export default function CategoryIconGrid({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
      {CATEGORY_ORDER.map((cat) => {
        const { icon: Icon, label } = CATEGORY_META[cat]
        const isSelected = selected === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            aria-pressed={isSelected}
            aria-label={`${label} 카테고리${isSelected ? ', 선택됨' : ''}`}
            className={cn(
              'flex flex-col items-center justify-center gap-2 min-h-[88px] rounded-2xl border-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSelected
                ? 'ring-2 ring-primary bg-primary/10 border-primary'
                : 'border-border bg-card hover:bg-accent',
            )}
          >
            <Icon size={40} aria-hidden="true" />
            <span className="text-lg font-bold">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
