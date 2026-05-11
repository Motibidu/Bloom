import { Heart } from 'lucide-react'

const main = 'oklch(0.62 0.15 220)'

interface Props {
  likeCount: number
  likedByMe: boolean
  onToggle: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export default function LikeButton({ likeCount, likedByMe, onToggle, disabled, size = 'sm' }: Props) {
  const iconSize = size === 'md' ? 22 : 18

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      disabled={disabled}
      className="flex items-center gap-1.5 min-h-[44px] px-1 rounded-xl transition-transform active:scale-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        color: likedByMe ? 'oklch(0.60 0.22 20)' : `oklch(0.55 0.05 220)`,
        '--tw-ring-color': main,
      } as React.CSSProperties}
      aria-label={likedByMe ? '좋아요 취소' : '좋아요'}
      aria-pressed={likedByMe}
    >
      <Heart
        size={iconSize}
        aria-hidden="true"
        style={likedByMe
          ? { fill: 'oklch(0.60 0.22 20)', color: 'oklch(0.60 0.22 20)' }
          : { color: `oklch(0.55 0.05 220)` }
        }
      />
      <span
        className="text-base font-bold"
        style={likedByMe
          ? { color: 'oklch(0.60 0.22 20)' }
          : { color: `oklch(0.55 0.05 220)` }
        }
      >
        {likeCount}
      </span>
    </button>
  )
}
