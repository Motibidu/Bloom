import { useNavigate, useParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ArrowLeft, MessageCircle, Trash2, Flag, ShieldOff, X, Link as LinkIcon, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useRef, useState } from 'react'
import {
  usePostDetail,
  usePostComments,
  useCreatePostComment,
  usePostLikeToggle,
  useDeletePost,
  type PostComment,
} from '@/hooks/usePost'
import { useCreateReport } from '@/hooks/useReport'
import { useBlockUser } from '@/hooks/useBlock'
import { useAuthStore } from '@/store/authStore'
import ReactionPicker from '@/components/ui/domain/checkin/reaction-picker'
import { isKakaoShareReady } from '@/lib/kakao'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad = `linear-gradient(135deg, ${main}, ${light})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

const REASON_LABELS: Record<string, string> = {
  SPAM: '스팸/도배',
  INAPPROPRIATE: '부적절한 콘텐츠',
  ABUSE: '욕설/혐오 표현',
  OTHER: '기타',
}

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  QNA: '질문공간',
  INFO: '정보공유',
}

// ── 삭제 확인 모달 ──────────────────────────────────────────────────────────
function DeleteConfirmModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void
  onClose: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'oklch(0 0 0 / 0.45)' }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="게시글 삭제 확인"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl px-6 pt-5 pb-8 space-y-5"
        style={{ background: 'white', boxShadow: `0 -8px 40px oklch(0.62 0.15 220 / 0.18)` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: mA(0.20) }} aria-hidden="true" />
        <div className="text-center space-y-2 pt-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'oklch(0.95 0.02 20)' }}
            aria-hidden="true"
          >
            <Trash2 size={24} style={{ color: 'oklch(0.55 0.18 20)' }} />
          </div>
          <h2 className="text-xl font-black text-foreground">게시글을 삭제할까요?</h2>
          <p className="text-base text-foreground/60">삭제한 게시글은 되돌릴 수 없어요.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
            style={{ background: mA(0.08), color: dark }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
            style={{ background: 'oklch(0.55 0.18 20)' }}
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 신고 모달 ────────────────────────────────────────────────────────────────
function ReportModal({
  postId,
  onClose,
  onSuccess,
}: {
  postId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const createReport = useCreateReport()
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async () => {
    if (!selected) return
    try {
      await createReport.mutateAsync({
        targetType: 'POST',
        targetId: postId,
        reason: selected as 'SPAM' | 'INAPPROPRIATE' | 'ABUSE' | 'OTHER',
      })
      onClose()
      onSuccess()
    } catch {
      toast.error('신고 처리 중 오류가 발생했어요.')
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'oklch(0 0 0 / 0.45)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="게시글 신고"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl px-6 pt-5 pb-8 space-y-5"
        style={{ background: 'white', boxShadow: `0 -8px 40px oklch(0.62 0.15 220 / 0.18)` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: mA(0.20) }} aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-foreground">신고 사유 선택</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center"
            style={{ background: mA(0.06), color: dark }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(REASON_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className="w-full min-h-[56px] flex items-center gap-3 px-5 py-4 rounded-2xl text-base font-bold text-left transition-all"
              style={{
                background: selected === value ? mA(0.10) : mA(0.04),
                border: `2px solid ${selected === value ? mA(0.40) : mA(0.10)}`,
                color: dark,
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{ borderColor: selected === value ? mA(1) : mA(0.30) }}
              >
                {selected === value && <div className="w-2.5 h-2.5 rounded-full" style={{ background: mA(1) }} />}
              </div>
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selected || createReport.isPending}
          className="w-full min-h-[56px] rounded-2xl text-lg font-black text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          style={{ background: 'oklch(0.55 0.18 20)' }}
        >
          {createReport.isPending ? '신고하는 중...' : '신고하기'}
        </button>
      </div>
    </div>
  )
}

// ── 차단 확인 모달 ────────────────────────────────────────────────────────────
function BlockConfirmModal({
  targetUserId,
  nickname,
  onClose,
  onSuccess,
}: {
  targetUserId: number
  nickname: string
  onClose: () => void
  onSuccess: () => void
}) {
  const blockUser = useBlockUser()
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleConfirm = async () => {
    await blockUser.mutateAsync(targetUserId)
    onClose()
    onSuccess()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'oklch(0 0 0 / 0.45)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="사용자 차단 확인"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl px-6 pt-5 pb-8 space-y-5"
        style={{ background: 'white', boxShadow: `0 -8px 40px oklch(0.62 0.15 220 / 0.18)` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: mA(0.20) }} aria-hidden="true" />
        <div className="text-center space-y-2 pt-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'oklch(0.95 0.02 20)' }}
            aria-hidden="true"
          >
            <ShieldOff size={24} style={{ color: 'oklch(0.55 0.18 20)' }} />
          </div>
          <h2 className="text-xl font-black text-foreground">{nickname}님을 차단할까요?</h2>
          <p className="text-base text-foreground/60">차단하면 이 분의 게시글이 보이지 않아요.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: mA(0.08), color: dark }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={blockUser.isPending}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black text-white disabled:opacity-40 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: 'oklch(0.55 0.18 20)' }}
          >
            {blockUser.isPending ? '차단하는 중...' : '차단하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BoardDetailPage() {
  const { id } = useParams()
  const postId = Number(id)
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.user)

  const { data: post, isLoading } = usePostDetail(postId)
  const { data: comments } = usePostComments(postId)
  const createComment = useCreatePostComment(postId)
  const likeToggle = usePostLikeToggle(postId)
  const deletePost = useDeletePost(postId)

  const [commentText, setCommentText] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<React.CSSProperties>({})

  const openMenu = () => {
    if (!menuOpen && menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setMenuOpen(prev => !prev)
  }

  if (isLoading || !post) {
    return <p role="status" aria-live="polite" className="text-center py-16 text-base text-foreground/50">불러오는 중이에요...</p>
  }

  const isOwner = currentUser?.id === post.userId

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return
    createComment.mutate(
      { content: commentText.trim(), commentType: 'TEXT' },
      { onSuccess: () => setCommentText('') }
    )
  }

  const handleReplySubmit = (parentId: number) => {
    if (!replyText.trim()) return
    createComment.mutate(
      { content: replyText.trim(), commentType: 'TEXT', parentId },
      { onSuccess: () => { setReplyText(''); setReplyTargetId(null) } }
    )
  }

  const handleDelete = async () => {
    await deletePost.mutateAsync()
    toast.success('게시글을 삭제했어요.')
    navigate('/board')
  }

  const shareUrl = `${window.location.origin}/board/${postId}`

  const handleKakaoShare = () => {
    if (isKakaoShareReady()) {
      const thumbnail = post.photoUrls[0]
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: post.title,
          description: `${post.nickname}님의 게시글`,
          ...(thumbnail ? { imageUrl: thumbnail } : {}),
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [{ title: '게시글 보러 가기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      })
    } else {
      toast('카카오톡 앱이 필요해요')
    }
  }

  const handleBandShare = () => {
    const text = encodeURIComponent(`${post.nickname}님의 게시글: ${post.title}\n${shareUrl}`)
    const route = encodeURIComponent(window.location.hostname)
    const appScheme = `bandapp://create/post?text=${text}&route=${route}`
    const webUrl = `https://band.us/plugin/share?body=${text}&route=${route}`
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const timer = setTimeout(() => {
        window.open(webUrl, '_blank', 'noopener,noreferrer,width=500,height=500')
      }, 1500)
      window.location.href = appScheme
      window.addEventListener('visibilitychange', () => {
        if (document.hidden) clearTimeout(timer)
      }, { once: true })
    } else {
      window.open(webUrl, '_blank', 'noopener,noreferrer,width=500,height=500')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('링크를 복사했어요')
    } catch {
      toast.error('링크 복사에 실패했어요')
    }
  }

  return (
    <main className="space-y-2 pb-24">
      <div className="flex items-center px-2 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="이전 페이지로 돌아가기"
          className="inline-flex items-center gap-1.5 min-h-[48px] px-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: dark, '--tw-ring-color': main } as React.CSSProperties}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-base font-bold">돌아가기</span>
        </button>
      </div>

      {menuOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90]"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="fixed z-[91] min-w-[140px] rounded-2xl py-1.5 overflow-hidden"
            style={{
              ...menuPos,
              background: 'white',
              border: `1px solid ${mA(0.15)}`,
              boxShadow: `0 8px 24px ${mA(0.18)}`,
            }}
          >
            {isOwner ? (
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); setDeleteConfirmOpen(true) }}
                className="w-full min-h-[48px] flex items-center gap-2.5 px-5 text-base font-bold text-destructive transition-colors text-left"
              >
                <Trash2 size={16} aria-hidden="true" />
                삭제하기
              </button>
            ) : (
              <>
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                  className="w-full min-h-[48px] flex items-center gap-2.5 px-5 text-base font-bold transition-colors text-left"
                  style={{ color: 'oklch(0.55 0.18 20)' }}
                >
                  <Flag size={16} aria-hidden="true" />
                  신고하기
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); setBlockOpen(true) }}
                  className="w-full min-h-[48px] flex items-center gap-2.5 px-5 text-base font-bold text-destructive transition-colors text-left"
                >
                  <ShieldOff size={16} aria-hidden="true" />
                  차단하기
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}

      {deleteConfirmOpen && createPortal(
        <DeleteConfirmModal
          onConfirm={() => { setDeleteConfirmOpen(false); handleDelete() }}
          onClose={() => setDeleteConfirmOpen(false)}
        />,
        document.body
      )}

      {reportOpen && createPortal(
        <ReportModal
          postId={postId}
          onClose={() => setReportOpen(false)}
          onSuccess={() => toast.success('신고가 접수되었습니다.')}
        />,
        document.body
      )}

      {blockOpen && createPortal(
        <BlockConfirmModal
          targetUserId={post.userId}
          nickname={post.nickname}
          onClose={() => setBlockOpen(false)}
          onSuccess={() => { toast.success(`${post.nickname}님을 차단했습니다.`); navigate('/board') }}
        />,
        document.body
      )}

      <article className="relative bg-white py-4 space-y-3">
        <div className="flex items-center gap-3 px-4">
          <div
            className="w-11 h-11 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-base font-black"
            style={post.profileImageUrl
              ? { boxShadow: `0 2px 8px ${mA(0.25)}` }
              : { background: grad, color: 'white', boxShadow: `0 2px 8px ${mA(0.25)}` }}
            aria-label={`${post.nickname} 아바타`}
          >
            {post.profileImageUrl ? (
              <img src={post.profileImageUrl} alt={`${post.nickname} 프로필`} className="w-full h-full object-cover" />
            ) : (
              <span aria-hidden="true">{post.nickname[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-base font-black text-foreground leading-tight truncate">{post.nickname}</span>
            <time className="text-sm text-foreground/50 font-medium leading-tight">
              {new Date(post.createdAt).toLocaleString('ko-KR')}
            </time>
          </div>
          <button
            ref={menuBtnRef}
            type="button"
            onClick={openMenu}
            aria-label="더 보기 메뉴"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ color: dark, background: menuOpen ? mA(0.10) : 'transparent' }}
          >
            <MoreVertical size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 space-y-3">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-sm font-bold" style={{ background: mA(0.10), border: `1px solid ${mA(0.22)}`, color: dark }}>
            {CATEGORY_LABELS[post.category]}
          </span>
          <h1 className="text-2xl font-black text-foreground leading-snug" style={serifStyle}>{post.title}</h1>
          <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.photoUrls.length > 0 && (
          <div className="px-4 grid grid-cols-1 gap-3">
            {post.photoUrls.map((url, i) => (
              <img key={i} src={url} alt={`첨부 사진 ${i + 1}`} className="w-full rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 px-4 pt-2" style={{ borderTop: `1px solid ${mA(0.10)}` }}>
          <ReactionPicker
            checkinId={postId}
            myReactionType={post.myReactionType}
            reactionCounts={post.reactionCounts}
            onReact={(reactionType: string) => likeToggle.mutate({ reactionType })}
            disabled={likeToggle.isPending}
          />
          <div className="flex items-center gap-1 min-h-[48px]" style={{ color: 'oklch(0.55 0.05 220)' }}>
            <MessageCircle size={20} aria-hidden="true" />
            <span className="text-sm font-bold">{post.commentCount}</span>
          </div>
        </div>
      </article>

      <div className="flex gap-2 justify-center px-4">
        <button
          type="button"
          onClick={handleKakaoShare}
          aria-label="카카오톡으로 이 게시글 공유하기"
          className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl text-base font-black transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: '#FEE500', color: 'rgba(0,0,0,0.90)', '--tw-ring-color': '#FEE500' } as React.CSSProperties}
        >
          <img src="/kakao/kakaotalk_sharing_btn_medium.png" alt="" width={20} height={20} aria-hidden="true" />
          <span>카카오톡</span>
        </button>
        <button
          type="button"
          onClick={handleBandShare}
          aria-label="네이버 밴드로 이 게시글 공유하기"
          className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl text-base font-black transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: '#00ee65', color: 'rgba(0,0,0,0.90)', '--tw-ring-color': '#00ee65' } as React.CSSProperties}
        >
          <img src="/band/band_icon.png" alt="" width={20} height={20} aria-hidden="true" />
          <span>밴드</span>
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="링크 복사"
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl text-base font-bold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: mA(0.10), color: dark, border: `1px solid ${mA(0.18)}`, '--tw-ring-color': main } as React.CSSProperties}
        >
          <LinkIcon size={16} aria-hidden="true" />
          <span>링크 복사</span>
        </button>
      </div>

      <section aria-labelledby="comments-label" className="px-4 space-y-4">
        <h2 id="comments-label" className="text-lg font-black text-foreground">댓글 {comments?.length ?? 0}개</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="댓글을 입력해 주세요"
            className="flex-1 h-14 text-base px-4 rounded-xl border-2 focus-visible:ring-0 outline-none"
            style={{ borderColor: mA(0.15) }}
          />
          <button
            type="button"
            onClick={handleCommentSubmit}
            disabled={!commentText.trim() || createComment.isPending}
            className="min-h-[56px] px-6 rounded-2xl text-base font-black text-white disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${main}, oklch(0.76 0.12 220))` }}
          >
            등록
          </button>
        </div>
        <div className="space-y-3">
          {(comments ?? []).map((c: PostComment) => (
            <div key={c.id} className="rounded-xl px-4 py-3 space-y-2" style={{ background: mA(0.04) }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-foreground">{c.nickname}</span>
              </div>
              <p className="text-base text-foreground/80">{c.content}</p>

              {/* 대댓글 목록 */}
              {c.replies && c.replies.length > 0 && (
                <div className="space-y-2 pl-4 ml-1" style={{ borderLeft: `3px solid ${mA(0.20)}` }}>
                  {c.replies.map(reply => (
                    <div key={reply.id} className="rounded-xl px-3 py-2.5" style={{ background: 'white' }}>
                      <span className="text-sm font-black text-foreground">{reply.nickname}</span>
                      <p className="text-base text-foreground/80 mt-0.5">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 답글 달기 버튼 */}
              <button
                type="button"
                onClick={() => setReplyTargetId(replyTargetId === c.id ? null : c.id)}
                className="min-h-[36px] text-sm font-bold rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2"
                style={{ color: mA(0.5), background: mA(0.06) }}
              >
                {replyTargetId === c.id ? '취소' : '↩ 답글 달기'}
              </button>

              {/* 답글 입력창 */}
              {replyTargetId === c.id && (
                <div className="flex gap-2 items-start pt-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="답글을 입력해 주세요"
                    className="flex-1 h-12 text-base px-3 rounded-xl border-2 focus-visible:ring-0 outline-none"
                    style={{ borderColor: mA(0.15) }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleReplySubmit(c.id)}
                    disabled={!replyText.trim() || createComment.isPending}
                    className="min-h-[48px] px-4 rounded-xl text-base font-black text-white disabled:opacity-40 shrink-0"
                    style={{ background: grad }}
                  >
                    등록
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
