import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, MessageCircle, MoreVertical, Send, X as XIcon } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import LikeButton from '@/components/ui/domain/checkin/like-button'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { useCheckinDetail, useLikeToggle, useDeleteCheckin } from '@/hooks/useCheckin'
import { useComments, useCreateComment } from '@/hooks/useComment'
import { useAuthStore } from '@/store/authStore'
import type { CheckIn, Comment } from '@/types'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

function formatRelativeTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt + 'Z').getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

function formatAbsoluteTime(createdAt: string): string {
  const date = new Date(createdAt + 'Z')
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일 ${hh}:${mm}`
}

export default function ActivityDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const checkinId = Number(id)

  const [commentText, setCommentText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const currentUser = useAuthStore((s) => s.user)

  const { data: checkinData, isLoading, isError } = useCheckinDetail(checkinId)
  const checkin = checkinData as CheckIn | undefined
  const { data: comments = [] } = useComments(checkinId)
  const likeToggle = useLikeToggle(checkinId)
  const deleteCheckin = useDeleteCheckin(checkinId)
  const createComment = useCreateComment(checkinId)

  const handleDelete = () => {
    if (!window.confirm('이 활동을 삭제할까요?')) return
    deleteCheckin.mutate(undefined, {
      onSuccess: () => navigate('/'),
    })
  }

  const handleLikeToggle = () => {
    if (!checkin) return
    likeToggle.mutate({ liked: checkin.likedByMe })
  }

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return
    createComment.mutate(commentText.trim(), {
      onSuccess: () => setCommentText(''),
    })
  }

  // ── 로딩 ─────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div
          role="status"
          aria-live="polite"
          aria-label="활동을 불러오는 중이에요"
          className="flex flex-col items-center gap-5 py-20"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: mA(0.12) }}
            aria-hidden="true"
          >
            <svg className="animate-spin h-9 w-9" viewBox="0 0 24 24" fill="none" style={{ color: main }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-muted-foreground">잠깐만 기다려 주세요...</p>
        </div>
      </main>
    )
  }

  // ── 에러 ─────────────────────────────────────────────────────────────────────
  if (isError || !checkin) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div role="alert" className="flex flex-col items-center gap-6 py-20 px-4 text-center">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: mA(0.10) }}
            aria-hidden="true"
          >
            <span className="text-5xl">😔</span>
          </div>
          <p className="text-2xl font-bold text-foreground">활동을 불러오지 못했어요</p>
          <p className="text-lg font-medium text-muted-foreground">잠시 후 다시 시도해 주세요</p>
        </div>
      </main>
    )
  }

  const { icon: Icon, label } = CATEGORY_META[checkin.category]
  const isOwner = currentUser != null && checkin.userId === currentUser.id
  const commentList = comments as Comment[]

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-7">

      {/* ── 뒤로가기 ─────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/')}
        aria-label="피드로 돌아가기"
        className="inline-flex items-center gap-2 min-h-[52px] px-3 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          color: dark,
          '--tw-ring-color': main,
        } as React.CSSProperties}
        onMouseEnter={e => { e.currentTarget.style.background = mA(0.08) }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <ArrowLeft size={22} aria-hidden="true" />
        <span className="text-lg font-bold">피드로 돌아가기</span>
      </button>

      {/* ── 본문 카드 ─────────────────────────────────────────────────────────── */}
      <article
        className="rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: `0 4px 24px ${mA(0.12)}, 0 1px 4px ${mA(0.08)}` }}
      >
        {/* 카테고리 배너 */}
        <div
          className="px-7 py-5 flex items-center justify-between"
          style={{ background: grad }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'oklch(1 0 0 / 0.20)' }}
              aria-hidden="true"
            >
              <Icon size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-black text-white/70">{label}</p>
              <time
                className="text-sm font-medium text-white/60"
                dateTime={checkin.createdAt}
              >
                {formatAbsoluteTime(checkin.createdAt)}
              </time>
            </div>
          </div>

          {/* 삭제 메뉴 (본인 글) */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label="더 보기 메뉴"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ color: 'white', background: menuOpen ? 'oklch(1 0 0 / 0.15)' : 'oklch(1 0 0 / 0.10)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.20)' }}
                onMouseLeave={e => { e.currentTarget.style.background = menuOpen ? 'oklch(1 0 0 / 0.15)' : 'oklch(1 0 0 / 0.10)' }}
              >
                <MoreVertical size={20} aria-hidden="true" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-20 min-w-[130px] rounded-2xl border py-1 overflow-hidden"
                    style={{
                      background: 'white',
                      border: `1px solid ${mA(0.15)}`,
                      boxShadow: `0 8px 24px ${mA(0.18)}`,
                    }}
                  >
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); handleDelete() }}
                      disabled={deleteCheckin.isPending}
                      className="w-full flex items-center gap-2 px-5 py-3.5 text-base font-bold text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-50 text-left"
                    >
                      삭제하기
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 작성자 프로필 */}
        <div className="px-7 pt-6 pb-2 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-lg font-black text-white"
            style={{
              background: grad,
              boxShadow: `0 2px 10px ${mA(0.25)}`,
            }}
            aria-hidden="true"
          >
            {checkin.nickname[0]}
          </div>
          <div>
            <p className="text-xl font-black text-foreground">{checkin.nickname}</p>
            <p className="text-base font-medium text-foreground/50">{label} 활동</p>
          </div>
        </div>

        {/* 제목 + 본문 */}
        <div className="px-7 pt-4 pb-6 space-y-3">
          <h1 className="text-2xl font-black text-foreground leading-snug">{checkin.title}</h1>
          <div
            className="h-px w-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${mA(0.25)}, ${lA(0.12)}, transparent)` }}
            aria-hidden="true"
          />
          <p className="text-lg font-medium text-foreground/80 leading-loose whitespace-pre-line">
            {checkin.description}
          </p>
        </div>

        {/* 사진 */}
        {checkin.photoUrls && checkin.photoUrls.length > 0 && (
          <div className="px-7 pb-6">
            {checkin.photoUrls.length === 1 ? (
              <img
                src={checkin.photoUrls[0]}
                alt={`${checkin.nickname}님의 ${label} 활동 사진`}
                className="w-full max-h-[480px] rounded-2xl object-cover cursor-pointer"
                style={{ boxShadow: `0 4px 16px ${mA(0.12)}` }}
                onClick={() => setLightboxIndex(0)}
              />
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
                {checkin.photoUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${checkin.nickname}님의 ${label} 활동 사진 ${i + 1}`}
                    className="shrink-0 w-72 max-h-[480px] rounded-2xl object-cover snap-start cursor-pointer"
                    style={{ boxShadow: `0 4px 16px ${mA(0.12)}` }}
                    onClick={() => setLightboxIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 반응 바 */}
        <div
          className="px-7 py-4 flex items-center gap-5"
          style={{
            borderTop: `1px solid ${mA(0.10)}`,
            background: `linear-gradient(to right, ${mA(0.04)}, transparent)`,
          }}
        >
          <LikeButton
            likeCount={checkin.likeCount}
            likedByMe={checkin.likedByMe}
            size="md"
            onToggle={handleLikeToggle}
          />

          <div
            className="flex items-center gap-1.5"
            aria-label={`댓글 ${commentList.length}개`}
            style={{ color: `oklch(0.55 0.05 220)` }}
          >
            <MessageCircle size={22} aria-hidden="true" />
            <span className="text-base font-bold">{commentList.length}</span>
          </div>

          <div
            className="flex items-center gap-1.5"
            aria-label={`조회 ${checkin.viewCount}회`}
            style={{ color: `oklch(0.65 0.03 220)` }}
          >
            <Eye size={22} aria-hidden="true" />
            <span className="text-base font-bold">{checkin.viewCount}</span>
          </div>
        </div>
      </article>

      {/* ── 댓글 영역 ─────────────────────────────────────────────────────────── */}
      <section aria-label="댓글" className="space-y-5">

        {/* 섹션 헤더 */}
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-foreground shrink-0">댓글</h2>
          <div
            className="flex-1 h-0.5 rounded-full"
            style={{ background: `linear-gradient(90deg, ${mA(0.30)}, ${lA(0.12)}, transparent)` }}
            aria-hidden="true"
          />
          <span
            className="text-sm font-black px-3 py-1.5 rounded-full text-white shrink-0"
            style={{ background: grad }}
          >
            {commentList.length}개
          </span>
        </div>

        {/* 댓글 목록 */}
        <div className="space-y-3">
          {commentList.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-10 flex flex-col items-center gap-3 text-center"
              style={{ background: mA(0.05), border: `1px dashed ${mA(0.20)}` }}
            >
              <span className="text-4xl" aria-hidden="true">💬</span>
              <p className="text-lg font-bold text-muted-foreground">
                아직 댓글이 없어요
              </p>
              <p className="text-base font-medium text-muted-foreground/70">
                첫 댓글을 남겨보세요!
              </p>
            </div>
          ) : (
            commentList.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl px-6 py-5 space-y-2"
                style={{
                  background: 'white',
                  border: `1px solid ${mA(0.10)}`,
                  boxShadow: `0 2px 8px ${mA(0.06)}`,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-white"
                      style={{ background: grad }}
                      aria-hidden="true"
                    >
                      {comment.nickname[0]}
                    </div>
                    <span className="text-base font-black text-foreground truncate">
                      {comment.nickname}
                    </span>
                  </div>
                  <time
                    className="text-sm font-medium shrink-0"
                    style={{ color: `oklch(0.60 0.03 220)` }}
                    dateTime={comment.createdAt}
                  >
                    {formatRelativeTime(comment.createdAt)}
                  </time>
                </div>
                <p className="text-base font-medium text-foreground/80 leading-relaxed pl-12">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* 댓글 입력 */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: 'white',
            border: `2px solid ${mA(0.18)}`,
            boxShadow: `0 2px 12px ${mA(0.08)}`,
          }}
        >
          <Textarea
            className="text-lg px-4 py-3 resize-none rounded-xl border-2 focus-visible:ring-0"
            style={commentText.length > 0 ? { borderColor: mA(0.45) } : { borderColor: mA(0.15) }}
            rows={3}
            maxLength={200}
            placeholder="따뜻한 댓글을 남겨보세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            aria-label="댓글 입력"
          />
          <div className="flex items-center justify-between">
            <span
              className="text-base font-medium"
              style={{ color: `oklch(0.60 0.04 220)` }}
              aria-live="polite"
            >
              {commentText.length}/200
            </span>
            <button
              onClick={handleCommentSubmit}
              disabled={!commentText.trim() || createComment.isPending}
              aria-busy={createComment.isPending}
              className="inline-flex items-center gap-2 min-h-[52px] px-7 rounded-2xl text-lg font-black text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: grad,
                '--tw-ring-color': main,
              } as React.CSSProperties}
              onMouseEnter={e => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = '0.88'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Send size={18} aria-hidden="true" />
              {createComment.isPending ? '보내는 중...' : '댓글 보내기'}
            </button>
          </div>
        </div>
      </section>

      {/* 라이트박스 오버레이 */}
      {lightboxIndex !== null && checkin.photoUrls && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'oklch(0 0 0 / 0.88)' }}
          onClick={() => setLightboxIndex(null)}
        >
          <img
            src={checkin.photoUrls[lightboxIndex]}
            alt={`사진 ${lightboxIndex + 1}`}
            className="max-w-[92vw] max-h-[88vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />

          {/* 닫기 */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="닫기"
            className="absolute top-5 right-5 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'oklch(1 0 0 / 0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.15)' }}
          >
            <XIcon size={24} className="text-white" aria-hidden="true" />
          </button>

          {/* 이전 */}
          {checkin.photoUrls.length > 1 && lightboxIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              aria-label="이전 사진"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'oklch(1 0 0 / 0.15)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.15)' }}
            >
              <ChevronLeft size={30} className="text-white" aria-hidden="true" />
            </button>
          )}

          {/* 다음 */}
          {checkin.photoUrls.length > 1 && lightboxIndex < checkin.photoUrls.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              aria-label="다음 사진"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'oklch(1 0 0 / 0.15)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.15)' }}
            >
              <ChevronRight size={30} className="text-white" aria-hidden="true" />
            </button>
          )}

          {/* 페이지 표시 */}
          {checkin.photoUrls.length > 1 && (
            <div
              className="absolute bottom-6 px-4 py-2 rounded-full text-lg font-bold text-white"
              style={{ background: 'oklch(1 0 0 / 0.15)' }}
            >
              {lightboxIndex + 1} / {checkin.photoUrls.length}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
