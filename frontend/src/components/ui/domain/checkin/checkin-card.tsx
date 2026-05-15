import { useState } from 'react'
import { Eye, MessageCircle, MoreVertical } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import ReactionPicker from '@/components/ui/domain/checkin/reaction-picker'
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
  isOwner?: boolean
  onDelete?: () => void
  onPhotoClick?: (index: number) => void
  commentCount?: number
}

export default function CheckInCard({
  checkin,
  onClick,
  showFullContent = false,
  isOwner = false,
  onDelete,
  onPhotoClick,
  commentCount,
}: Props) {
  const { icon: Icon, label } = CATEGORY_META[checkin.category]
  const likeToggle = useLikeToggle(checkin.id)
  const [menuOpen, setMenuOpen] = useState(false)

  const isClickable = !!onClick

  return (
    <article
      className={`
        group relative rounded-2xl bg-white overflow-hidden flex flex-col
        checkin-card
        ${isClickable ? 'checkin-card--clickable cursor-pointer' : ''}
      `}
      style={{
        boxShadow: `0 2px 16px ${mA(0.08)}, 0 1px 4px ${mA(0.06)}`,
      }}
    >
      <style>{`
        .checkin-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .checkin-card--clickable:hover {
          box-shadow: 0 8px 32px ${mA(0.18)}, 0 2px 8px ${mA(0.10)};
          transform: translateY(-3px);
        }
        @media (prefers-reduced-motion: reduce) {
          .checkin-card {
            transition: none;
          }
          .checkin-card--clickable:hover {
            transform: none;
          }
        }
      `}</style>

      {/* 카드 전체 클릭 영역 */}
      {isClickable && (
        <button
          type="button"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring rounded-2xl"
          aria-label={`${checkin.nickname}님의 ${label} 활동: ${checkin.title}`}
          onClick={onClick}
        />
      )}

      {/* 헤더 */}
      <div className="pl-5 pr-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-black"
            style={{ background: grad, color: 'white', boxShadow: `0 2px 8px ${mA(0.25)}` }}
            aria-label={`${checkin.nickname} 아바타`}
          >
            <span aria-hidden="true">{checkin.nickname[0]}</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-foreground leading-none shrink-0">
                {checkin.nickname}
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold shrink-0"
                style={{ background: mA(0.10), border: `1px solid ${mA(0.22)}`, color: dark }}
              >
                <Icon size={13} aria-hidden="true" />
                {label}
              </span>
            </div>
            <time
              className="text-sm text-foreground/50 font-medium leading-none"
              dateTime={checkin.createdAt}
            >
              {formatAbsoluteTime(checkin.createdAt)}
            </time>
          </div>

          {/* 삭제 메뉴 (detail 페이지 소유자 전용) */}
          {isOwner && onDelete && (
            <div className="relative z-10">
              <button
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label="더 보기 메뉴"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ color: dark, background: menuOpen ? mA(0.10) : 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = mA(0.08) }}
                onMouseLeave={e => { e.currentTarget.style.background = menuOpen ? mA(0.10) : 'transparent' }}
              >
                <MoreVertical size={20} aria-hidden="true" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-11 z-20 min-w-[130px] rounded-2xl py-1 overflow-hidden"
                    style={{ background: 'white', border: `1px solid ${mA(0.15)}`, boxShadow: `0 8px 24px ${mA(0.18)}` }}
                  >
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); onDelete() }}
                      className="w-full flex items-center gap-2 px-5 py-3.5 text-base font-bold text-destructive hover:bg-destructive/8 transition-colors text-left"
                    >
                      삭제하기
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <hr className="mx-6 border-none h-px" style={{ background: mA(0.18) }} />

      {/* 본문 */}
      <div className={`pl-7 pr-5 pt-4 pb-5 flex-1 ${showFullContent ? 'min-h-[200px]' : 'min-h-[160px]'}`}>
        <h3
          className="text-xl font-black text-foreground mb-2 leading-snug"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          {checkin.title}
        </h3>
        <p className={`text-base text-foreground/75 leading-relaxed ${showFullContent ? '' : 'line-clamp-3'}`}>
          {checkin.description}
        </p>
      </div>

      {/* 사진 */}
      {checkin.photoUrls && checkin.photoUrls.length > 0 && (
        <div className="px-5 pb-5">
          {checkin.photoUrls.length === 1 ? (
            <img
              src={checkin.photoUrls[0]}
              alt={`${checkin.nickname}님의 ${label} 활동 사진`}
              width={640}
              height={288}
              className={`w-full max-h-72 rounded-xl object-cover ${onPhotoClick ? 'cursor-pointer' : ''}`}
              style={{ boxShadow: `0 2px 12px ${mA(0.10)}` }}
              loading="lazy"
              onClick={onPhotoClick ? () => onPhotoClick(0) : undefined}
            />
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
              {checkin.photoUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${checkin.nickname}님의 ${label} 활동 사진 ${i + 1}`}
                  width={256}
                  height={208}
                  className={`shrink-0 w-64 h-52 rounded-xl object-cover snap-start ${onPhotoClick ? 'cursor-pointer' : ''}`}
                  style={{ boxShadow: `0 2px 12px ${mA(0.10)}` }}
                  loading="lazy"
                  onClick={onPhotoClick ? () => onPhotoClick(i) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 하단 반응 바 */}
      <div
        className="px-5 flex items-center gap-4 relative mt-auto"
        style={{
          borderTop: `1px solid ${mA(0.10)}`,
          background: `linear-gradient(to right, ${mA(0.03)}, transparent)`,
        }}
      >
        <ReactionPicker
          checkinId={checkin.id}
          myReactionType={checkin.myReactionType ?? null}
          reactionCounts={checkin.reactionCounts ?? {}}
          onReact={(reactionType) => likeToggle.mutate({ reactionType })}
          disabled={likeToggle.isPending}
        />

        <div
          className="flex items-center gap-1.5 min-h-[44px] px-1"
          style={{ color: `oklch(0.55 0.05 220)` }}
          aria-label={`댓글 ${commentCount ?? checkin.commentCount}개`}
        >
          <MessageCircle size={22} aria-hidden="true" />
          <span className="text-base font-bold" aria-hidden="true">{commentCount ?? checkin.commentCount}</span>
        </div>

        <span
          className="flex items-center gap-1.5 min-h-[44px] px-1"
          style={{ color: `oklch(0.65 0.03 220)` }}
        >
          <Eye size={22} aria-hidden="true" />
          <span className="text-base font-bold">
            <span className="sr-only">조회 </span>
            {checkin.viewCount}
            <span className="sr-only">회</span>
          </span>
        </span>

        <div className="flex-1 flex justify-end items-center pointer-events-none" aria-hidden="true">
          <Icon size={28} style={{ color: lA(0.18) }} />
        </div>
      </div>
    </article>
  )
}
