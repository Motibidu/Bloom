import { Heart } from 'lucide-react'

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
      className={`flex items-center gap-1 min-h-[44px] rounded-xl transition-transform active:scale-90 ${
        likedByMe ? 'text-red-500' : 'text-foreground'
      } disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
      aria-label={likedByMe ? '좋아요 취소' : '좋아요'}
    >
      <Heart
        size={iconSize}
        aria-hidden="true"
        className={likedByMe ? 'fill-red-500 text-red-500' : 'text-foreground'}
      />
      <span className="text-base font-semibold">{likeCount}</span>
    </button>
  )
}
