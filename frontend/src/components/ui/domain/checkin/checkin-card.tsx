import { Eye, MessageCircle } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import LikeButton from '@/components/ui/domain/checkin/like-button'
import { useLikeToggle } from '@/hooks/useCheckin'
import type { CheckIn } from '@/types'

function formatAbsoluteTime(createdAt: string): string {
  const date = new Date(createdAt + 'Z')
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일 ${hh}:${mm}`
}

interface Props {
  checkin: CheckIn
  onClick?: () => void
  showFullContent?: boolean
}

export default function CheckInCard({ checkin, onClick, showFullContent = false }: Props) {
  const { icon: Icon, label } = CATEGORY_META[checkin.category]
  const likeToggle = useLikeToggle(checkin.id)

  return (
    <div
      className={`rounded-2xl border border-border bg-card overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      {/* 헤더 + 제목 + 내용 */}
      <div className="px-5 pt-5 pb-4 space-y-1">
        {/* 프로필 행 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-primary">{checkin.nickname[0]}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground">{checkin.nickname}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-foreground/60">{formatAbsoluteTime(checkin.createdAt)}</span>
              <Icon size={16} className="text-primary shrink-0" aria-hidden="true" />
            </div>
          </div>
        </div>
        <p className="text-xl font-bold text-foreground">{checkin.title}</p>
        <p className={`text-base text-foreground ${showFullContent ? '' : 'line-clamp-3'}`}>
          {checkin.description}
        </p>
      </div>

      {/* 사진 */}
      {checkin.photoUrl && (
        <div className="px-5 pb-4">
          <img
            src={checkin.photoUrl}
            alt={`${checkin.nickname}님의 ${label} 활동 사진`}
            className="max-h-64 max-w-full rounded-xl object-contain"
          />
        </div>
      )}

      {/* 하단 */}
      <div className="px-4 py-0 flex items-center gap-5 border-t border-border">
        <LikeButton
          likeCount={checkin.likeCount}
          likedByMe={checkin.likedByMe}
          onToggle={() => likeToggle.mutate({ liked: checkin.likedByMe })}
          disabled={likeToggle.isPending}
          size="md"
        />
        <div className="flex items-center gap-1 text-foreground">
          <MessageCircle size={22} aria-hidden="true" />
          <span className="text-base font-semibold">{checkin.commentCount}</span>
        </div>
        <div className="flex items-center gap-1 text-foreground">
          <Eye size={22} aria-hidden="true" />
          <span className="text-base font-semibold">{checkin.viewCount}</span>
        </div>
      </div>
    </div>
  )
}
