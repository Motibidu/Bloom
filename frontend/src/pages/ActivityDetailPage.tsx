import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, MessageCircle, MoreVertical } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import LikeButton from '@/components/ui/domain/checkin/like-button'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { useCheckinDetail, useLikeToggle, useDeleteCheckin } from '@/hooks/useCheckin'
import { useComments, useCreateComment } from '@/hooks/useComment'
import { useAuthStore } from '@/store/authStore'
import type { CheckIn, Comment } from '@/types'

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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 flex justify-center">
        <p className="text-xl text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (isError || !checkin) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 flex justify-center">
        <p className="text-xl text-destructive">활동을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      </div>
    )
  }

  const { icon: Icon, label } = CATEGORY_META[checkin.category]
  const isOwner = currentUser != null && checkin.userId === currentUser.id

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/')}
        aria-label="피드로 돌아가기"
        className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors -ml-2 py-2 px-2 rounded-xl min-h-[52px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <ArrowLeft size={24} aria-hidden="true" />
        <span className="text-lg font-bold">피드로</span>
      </button>

      {/* 체크인 상세 카드 */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">

        {/* 카드 헤더: 아바타 + 닉네임/메타 + 메뉴 */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-3">
          {/* 원형 아바타 */}
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-primary">{checkin.nickname.charAt(0)}</span>
          </div>

          {/* 닉네임 + 날짜·카테고리 아이콘 */}
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-foreground leading-tight">{checkin.nickname}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-foreground/60">{formatAbsoluteTime(checkin.createdAt)}</span>
              <Icon size={16} className="text-primary shrink-0" aria-hidden="true" />
            </div>
          </div>

          {/* MoreVertical 메뉴 (본인 글일 때만) */}
          {isOwner && (
            <div className="ml-auto relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="더 보기 메뉴"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-foreground/50 hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <MoreVertical size={22} aria-hidden="true" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                  <div role="menu" className="absolute right-0 top-11 z-20 min-w-[120px] rounded-xl border border-border bg-card shadow-lg py-1 overflow-hidden">
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); handleDelete() }}
                      disabled={deleteCheckin.isPending}
                      className="w-full flex items-center gap-2 px-4 py-3 text-base font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 text-left"
                    >
                      삭제하기
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 제목 + 본문 */}
        <div className="px-5 pb-4 space-y-1">
          <p className="text-xl font-bold text-foreground">{checkin.title}</p>
          <p className="text-base text-foreground">{checkin.description}</p>
        </div>

        {/* 사진 */}
        {checkin.photoUrl && (
          <div className="px-0">
            <img
              src={checkin.photoUrl}
              alt={`${checkin.nickname}님의 ${label} 활동 사진`}
              className="w-full object-cover max-h-96"
            />
          </div>
        )}

        {/* 하단 바: 박수! + 좋아요수 / 댓글수 / 조회수 */}
        <div className="px-4 py-2 flex items-center gap-5 border-t border-border">
          <div className="flex items-center gap-2">
            <LikeButton
              likeCount={checkin.likeCount}
              likedByMe={checkin.likedByMe}
              size="md"
              onToggle={handleLikeToggle}
            />
          </div>

          <div
            className="flex items-center gap-1.5 text-foreground/70"
            aria-label={`댓글 ${(comments as Comment[]).length}개`}
          >
            <MessageCircle size={20} aria-hidden="true" />
            <span className="text-lg font-semibold">{(comments as Comment[]).length}</span>
          </div>

          <div
            className="flex items-center gap-1.5 text-foreground/70"
            aria-label={`조회수 ${checkin.viewCount}회`}
          >
            <Eye size={20} aria-hidden="true" />
            <span className="text-lg font-semibold">{checkin.viewCount}</span>
          </div>
        </div>
      </div>

      {/* 댓글 영역 */}
      <section aria-label="코멘트" className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">코멘트</h2>

        {/* 댓글 목록 */}
        <div className="space-y-3">
          {(comments as Comment[]).length === 0 ? (
            <p className="text-lg font-semibold text-foreground/60 py-4 text-center">
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </p>
          ) : (
            (comments as Comment[]).map((comment) => (
              <div key={comment.id} className="rounded-2xl bg-muted/50 px-6 py-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">{comment.nickname}</span>
                  <span className="text-base font-medium text-foreground/60">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-lg text-foreground leading-relaxed">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* 댓글 입력 */}
        <div className="space-y-3 pt-1">
          <Textarea
            className="text-lg px-4 py-3 resize-none rounded-xl border-2 focus-visible:ring-2 focus-visible:ring-primary"
            rows={3}
            maxLength={200}
            placeholder="댓글 달기..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            aria-label="댓글 입력"
          />
          <div className="flex justify-end">
            <button
              onClick={handleCommentSubmit}
              disabled={!commentText.trim() || createComment.isPending}
              aria-busy={createComment.isPending}
              className="bg-primary text-primary-foreground rounded-full px-6 py-2 text-base font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
            >
              {createComment.isPending ? '보내는 중...' : '보내기'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
