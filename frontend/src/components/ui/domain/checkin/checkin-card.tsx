import { Eye, MessageCircle } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import LikeButton from '@/components/ui/domain/checkin/like-button'
import { useLikeToggle } from '@/hooks/useCheckin'
import type { CheckIn } from '@/types'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const grad = `linear-gradient(135deg, ${main}, ${light})`

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
    <article
      onClick={onClick}
      style={{
        boxShadow: `0 2px 16px ${mA(0.08)}, 0 1px 4px ${mA(0.06)}`,
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
      }}
      className={`
        group relative rounded-2xl bg-white overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onMouseEnter={onClick ? (e) => {
        const el = e.currentTarget
        el.style.boxShadow = `0 8px 32px ${mA(0.18)}, 0 2px 8px ${mA(0.10)}`
        el.style.transform = 'translateY(-3px)'
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        const el = e.currentTarget
        el.style.boxShadow = `0 2px 16px ${mA(0.08)}, 0 1px 4px ${mA(0.06)}`
        el.style.transform = 'translateY(0)'
      } : undefined}
    >
      {/* 좌측 카테고리 컬러 바 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{ background: grad }}
        aria-hidden="true"
      />

      {/* 메인 콘텐츠 */}
      <div className="pl-6 pr-5 pt-5 pb-4">

        {/* 프로필 행 */}
        <div className="flex items-start gap-3 mb-3">
          {/* 아바타 */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-black"
            style={{
              background: grad,
              color: 'white',
              boxShadow: `0 2px 8px ${mA(0.25)}`,
            }}
            aria-hidden="true"
          >
            {checkin.nickname[0]}
          </div>

          <div className="flex-1 min-w-0">
            {/* 닉네임 + 카테고리 뱃지 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-base font-black text-foreground"
              >
                {checkin.nickname}
              </span>
              {/* 카테고리 pill */}
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold"
                style={{
                  background: mA(0.10),
                  border: `1px solid ${mA(0.22)}`,
                  color: dark,
                }}
              >
                <Icon size={13} aria-hidden="true" />
                {label}
              </span>
            </div>
            {/* 시각 */}
            <time
              className="text-sm text-foreground/50 font-medium"
              dateTime={checkin.createdAt}
            >
              {formatAbsoluteTime(checkin.createdAt)}
            </time>
          </div>
        </div>

        {/* 제목 */}
        <p
          className="text-xl font-black text-foreground mb-1.5 leading-snug"
        >
          {checkin.title}
        </p>

        {/* 본문 */}
        <p
          className={`text-base text-foreground/75 leading-relaxed ${showFullContent ? '' : 'line-clamp-3'}`}
        >
          {checkin.description}
        </p>
      </div>

      {/* 사진 */}
      {checkin.photoUrls && checkin.photoUrls.length > 0 && (
        <div className="px-5 pb-4">
          {checkin.photoUrls.length === 1 ? (
            <img
              src={checkin.photoUrls[0]}
              alt={`${checkin.nickname}님의 ${label} 활동 사진`}
              className="w-full max-h-72 rounded-xl object-cover"
              style={{ boxShadow: `0 2px 12px ${mA(0.10)}` }}
            />
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
              {checkin.photoUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${checkin.nickname}님의 ${label} 활동 사진 ${i + 1}`}
                  className="shrink-0 w-64 h-52 rounded-xl object-cover snap-start"
                  style={{ boxShadow: `0 2px 12px ${mA(0.10)}` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 하단 반응 바 */}
      <div
        className="px-5 py-2.5 flex items-center gap-4"
        style={{
          borderTop: `1px solid ${mA(0.10)}`,
          background: `linear-gradient(to right, ${mA(0.03)}, transparent)`,
        }}
      >
        <LikeButton
          likeCount={checkin.likeCount}
          likedByMe={checkin.likedByMe}
          onToggle={() => likeToggle.mutate({ liked: checkin.likedByMe })}
          disabled={likeToggle.isPending}
          size="md"
        />

        <button
          type="button"
          className="flex items-center gap-1.5 min-h-[44px] rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{ color: `oklch(0.55 0.05 220)` }}
          aria-label={`댓글 ${checkin.commentCount}개`}
          onClick={(e) => e.stopPropagation()}
          tabIndex={onClick ? -1 : 0}
        >
          <MessageCircle size={22} aria-hidden="true" />
          <span className="text-base font-bold">{checkin.commentCount}</span>
        </button>

        <div
          className="flex items-center gap-1.5 min-h-[44px] px-1"
          style={{ color: `oklch(0.65 0.03 220)` }}
          aria-label={`조회 ${checkin.viewCount}회`}
        >
          <Eye size={22} aria-hidden="true" />
          <span className="text-base font-bold">{checkin.viewCount}</span>
        </div>

        {/* 우측 여백 채우기 + 카테고리 대형 워터마크 아이콘 */}
        <div className="flex-1 flex justify-end items-center pointer-events-none" aria-hidden="true">
          <Icon
            size={28}
            style={{ color: lA(0.18) }}
          />
        </div>
      </div>
    </article>
  )
}
