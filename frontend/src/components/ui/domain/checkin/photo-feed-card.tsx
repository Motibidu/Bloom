import { Heart, MessageCircle } from 'lucide-react'
import type { CheckIn } from '@/types'

const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

function formatShortDate(createdAt: string): string {
  const date = new Date(createdAt + 'Z')
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`
}

interface Props {
  checkin: CheckIn
  onClick: () => void
}

export default function PhotoFeedCard({ checkin, onClick }: Props) {
  const photoUrl = checkin.photoUrls?.[0]
  if (!photoUrl) return null

  const totalReactions = Object.values(checkin.reactionCounts ?? {}).reduce((a, b) => a + b, 0)

  return (
    <article
      className="relative rounded-2xl overflow-hidden cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ aspectRatio: '4 / 5', boxShadow: `0 2px 16px ${mA(0.12)}`, '--tw-ring-color': 'oklch(0.62 0.15 220)' } as React.CSSProperties}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      aria-label={`${checkin.nickname}님의 활동: ${checkin.title}`}
    >
      <img
        src={photoUrl}
        alt={`${checkin.nickname}님의 ${checkin.title} 활동 사진`}
        width={320}
        height={400}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{ background: 'linear-gradient(to top, oklch(0 0 0 / 0.75), oklch(0 0 0 / 0.25) 55%, transparent 100%)' }}
        aria-hidden="true"
      />
      <span
        className="absolute top-2.5 right-2.5 text-xs font-bold text-white px-2 py-1 rounded-full"
        style={{ background: 'oklch(0 0 0 / 0.35)', backdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      >
        {formatShortDate(checkin.createdAt)}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5">
        <h3
          className="text-white font-black text-base leading-snug line-clamp-1"
          style={{ wordBreak: 'keep-all', textShadow: '0 1px 4px oklch(0 0 0 / 0.4)' }}
        >
          {checkin.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-white/90 text-sm font-bold truncate">{checkin.nickname}</span>
          <div className="flex items-center gap-2.5 shrink-0" aria-hidden="true">
            <span className="flex items-center gap-1 text-white text-xs font-bold">
              <Heart size={13} />
              {totalReactions}
            </span>
            <span className="flex items-center gap-1 text-white text-xs font-bold">
              <MessageCircle size={13} />
              {checkin.commentCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
