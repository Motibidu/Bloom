import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Send, X as XIcon, AlertTriangle, MoreVertical, Pencil, Trash2, Flag, Link } from 'lucide-react'
import { toast } from 'sonner'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import PraiseCardPicker, { PRAISE_CARDS } from '@/components/ui/domain/checkin/praise-card-picker'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/shadcn/dropdown-menu'
import { useCheckinDetail, useDeleteCheckin } from '@/hooks/useCheckin'
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from '@/hooks/useComment'
import { useCreateReport } from '@/hooks/useReport'
import { useAuthStore } from '@/store/authStore'
import { useScrollContainer } from '@/lib/scrollContext'
import { isKakaoShareReady } from '@/lib/kakao'
import type { CheckIn, Comment } from '@/types'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
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


export default function ActivityDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const checkinId = Number(id)

  const [commentText, setCommentText] = useState('')
  const [commentExpanded, setCommentExpanded] = useState(false)
  const [commentTab, setCommentTab] = useState<'text' | 'praise'>('text')
  const [selectedPraiseCard, setSelectedPraiseCard] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null)
  const [reportCommentId, setReportCommentId] = useState<number | null>(null)

  const currentUser = useAuthStore((s) => s.user)
  const scrollContainer = useScrollContainer()

  // 상세 페이지 진입 시 스크롤 항상 최상단으로
  useEffect(() => {
    const el = scrollContainer?.current
    if (el) el.scrollTop = 0
  }, [checkinId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: checkinData, isLoading, isError } = useCheckinDetail(checkinId)
  const checkin = checkinData as CheckIn | undefined
  const { data: comments = [] } = useComments(checkinId)
  const deleteCheckin = useDeleteCheckin(checkinId)
  const createComment = useCreateComment(checkinId)
  const deleteComment = useDeleteComment(checkinId)
  const updateComment = useUpdateComment(checkinId)
  const createReport = useCreateReport()

  const handleDeleteConfirm = () => {
    deleteCheckin.mutate(undefined, {
      onSuccess: () => navigate('/'),
    })
  }

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return
    createComment.mutate({ content: commentText.trim(), commentType: 'TEXT' }, {
      onSuccess: () => { setCommentText(''); setCommentExpanded(false) },
    })
  }

  const handleDeleteComment = () => {
    if (!deleteCommentId) return
    deleteComment.mutate(deleteCommentId, {
      onSuccess: () => {
        setDeleteCommentId(null)
        toast.success('댓글을 삭제했어요')
      },
      onError: () => toast.error('삭제에 실패했어요'),
    })
  }

  const handleUpdateComment = (commentId: number) => {
    if (!editText.trim()) return
    updateComment.mutate({ commentId, content: editText.trim() }, {
      onSuccess: () => {
        setEditingCommentId(null)
        setEditText('')
        toast.success('댓글을 수정했어요')
      },
      onError: () => toast.error('수정에 실패했어요'),
    })
  }

  const handleReport = (reason: 'SPAM' | 'INAPPROPRIATE' | 'ABUSE' | 'OTHER') => {
    if (!reportCommentId) return
    createReport.mutate({ targetType: 'COMMENT', targetId: reportCommentId, reason }, {
      onSuccess: () => {
        setReportCommentId(null)
        toast.success('신고가 접수됐어요')
      },
      onError: () => toast.error('신고에 실패했어요'),
    })
  }

  const handleReplySubmit = (parentId: number) => {
    if (!replyText.trim()) return
    createComment.mutate({ content: replyText.trim(), commentType: 'TEXT', parentId }, {
      onSuccess: () => {
        setReplyText('')
        setReplyTargetId(null)
      },
    })
  }

  const handlePraiseCardSubmit = () => {
    if (!selectedPraiseCard) return
    createComment.mutate(
      { commentType: 'PRAISE_CARD', praiseCardType: selectedPraiseCard },
      {
        onSuccess: () => {
          setSelectedPraiseCard(null)
          setCommentTab('text')
          setCommentExpanded(false)
        },
      }
    )
  }

  const handleShare = (c: CheckIn) => {
    const url = `${window.location.origin}/share/checkin/${c.id}`
    if (isKakaoShareReady()) {
      const thumbnail = c.photoUrls?.[0]
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: c.title,
          description: `${c.nickname}님의 오늘 활동`,
          // 카카오 SDK는 imageUrl 키가 있으면서 값이 비어있으면 거부하므로 사진이 있을 때만 포함
          ...(thumbnail ? { imageUrl: thumbnail } : {}),
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: '활동 보러 가기', link: { mobileWebUrl: url, webUrl: url } }],
      })
    } else {
      toast('카카오톡 앱이 필요해요')
    }
  }

  const handleCopyLink = async (c: CheckIn) => {
    const url = `${window.location.origin}/share/checkin/${c.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('링크를 복사했어요')
    } catch {
      toast.error('링크 복사에 실패했어요')
    }
  }

  const handleBandShare = (c: CheckIn) => {
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin
    const shareUrl = `${baseUrl}/share/checkin/${c.id}`
    const text = encodeURIComponent(`${c.nickname}님의 활동: ${c.title}\n${shareUrl}`)
    const route = encodeURIComponent(window.location.hostname)
    // 모바일: 밴드 앱 직접 호출, 앱 미설치 시 웹 팝업으로 fallback
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

  const isOwner = currentUser != null && checkin.userId === currentUser.id
  const commentList = comments as Comment[]

  return (
    <main className="w-full md:max-w-2xl md:mx-auto md:px-6 pt-5 pb-10 space-y-6">

      {/* ── 상단 바: 뒤로가기 ──────────────────────────────────────────────────── */}


      {/* ── 본문 카드 ─────────────────────────────────────────────────────────── */}
      <CheckInCard
        checkin={checkin}
        showFullContent
        isOwner={isOwner}
        onDelete={() => setDeleteConfirmOpen(true)}
        onPhotoClick={(i) => setLightboxIndex(i)}
        commentCount={commentList.length}
      />

      {/* ── 공유 버튼 그룹 ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 justify-center">
        {/* 카카오톡 */}
        <button
          onClick={() => handleShare(checkin)}
          aria-label="카카오톡으로 이 활동 공유하기"
          className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-sm font-black transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: '#FEE500', color: 'rgba(0,0,0,0.90)', '--tw-ring-color': '#FEE500' } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.80' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <img src="/kakao/kakaotalk_sharing_btn_medium.png" alt="" width={20} height={20} aria-hidden="true" />
          <span>카카오톡</span>
        </button>

        {/* 네이버 밴드 */}
        <button
          onClick={() => handleBandShare(checkin)}
          aria-label="네이버 밴드로 이 활동 공유하기"
          className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-sm font-black transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: '#00ee65', color: 'rgba(0,0,0,0.90)', '--tw-ring-color': '#00ee65' } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.80' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <img src="/band/band_icon.png" alt="" width={20} height={20} aria-hidden="true" />
          <span>밴드</span>
        </button>

        {/* 링크 복사 */}
        <button
          onClick={() => handleCopyLink(checkin)}
          aria-label="링크 복사"
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-sm font-bold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: mA(0.10), color: dark, border: `1px solid ${mA(0.18)}`, '--tw-ring-color': main } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <Link size={16} aria-hidden="true" />
          <span>링크 복사</span>
        </button>
      </div>

      {/* ── 삭제 확인 모달 ────────────────────────────────────────────────────── */}
      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'oklch(0 0 0 / 0.50)' }}
          onClick={() => setDeleteConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="활동 삭제 확인"
        >
          <div
            className="w-full max-w-sm rounded-3xl px-7 py-8 space-y-6"
            style={{ background: 'white', boxShadow: `0 8px 40px ${mA(0.25)}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'oklch(0.95 0.02 25)' }}
                aria-hidden="true"
              >
                <AlertTriangle size={32} className="text-destructive" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-foreground">활동을 삭제할까요?</h3>
                <p className="text-base font-medium text-muted-foreground leading-relaxed">
                  삭제한 활동은 복구할 수 없어요
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 min-h-[52px] rounded-2xl text-lg font-black focus-visible:outline-none focus-visible:ring-2"
                style={{ background: mA(0.08), color: dark }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteCheckin.isPending}
                className="flex-1 min-h-[52px] rounded-2xl text-lg font-black text-white focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                style={{ background: 'oklch(0.55 0.18 25)' }}
              >
                {deleteCheckin.isPending ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 댓글 영역 ──────────────────────────────────────────────────────────── */}
      <section aria-label="댓글" className="w-full space-y-5">

        {/* 댓글 입력 */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'white',
            border: `1px solid ${mA(0.12)}`,
            boxShadow: `0 2px 10px ${mA(0.07)}`,
          }}
        >
          {!commentExpanded ? (
            /* 접힌 상태: 아바타 + 한 줄 입력창 */
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base font-black text-white"
                style={{ background: grad }}
                aria-hidden="true"
              >
                {currentUser?.nickname?.[0] ?? '?'}
              </div>
              <button
                onClick={() => setCommentExpanded(true)}
                className="flex-1 h-10 rounded-full text-left px-4 text-base focus-visible:outline-none focus-visible:ring-2"
                style={{
                  border: `1px solid ${mA(0.20)}`,
                  color: mA(0.40),
                  background: mA(0.04),
                  '--tw-ring-color': main,
                } as React.CSSProperties}
              >
                댓글 추가...
              </button>
            </div>
          ) : (
            /* 펼친 상태: 탭 + 입력 + 취소/등록 */
            <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${mA(0.18)}` }}>
              {/* 탭 */}
              <div
                className="flex gap-2 px-3 pt-3 pb-2"
                style={{ borderBottom: `1px solid ${mA(0.10)}` }}
                role="tablist"
                aria-label="댓글 유형 선택"
              >
                <button
                  role="tab"
                  aria-selected={commentTab === 'text'}
                  onClick={() => setCommentTab('text')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: commentTab === 'text' ? grad : mA(0.07),
                    color: commentTab === 'text' ? 'white' : dark,
                    '--tw-ring-color': main,
                  } as React.CSSProperties}
                >
                  <span aria-hidden="true">💬</span> 댓글
                </button>
                <button
                  role="tab"
                  aria-selected={commentTab === 'praise'}
                  onClick={() => setCommentTab('praise')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: commentTab === 'praise' ? grad : mA(0.07),
                    color: commentTab === 'praise' ? 'white' : dark,
                    '--tw-ring-color': main,
                  } as React.CSSProperties}
                >
                  <span aria-hidden="true">💌</span> 칭찬카드
                </button>
              </div>

              {/* 댓글 패널 */}
              {commentTab === 'text' && (
                <div className="px-4 py-3 space-y-3">
                  <Textarea
                    className="text-base px-3 py-2.5 resize-none rounded-xl border-2 focus-visible:ring-0"
                    style={commentText.length > 0 ? { borderColor: mA(0.45) } : { borderColor: mA(0.15) }}
                    rows={3}
                    placeholder="따뜻한 댓글을 남겨보세요..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    aria-label="댓글 입력"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setCommentExpanded(false); setCommentText('') }}
                      className="inline-flex items-center min-h-[44px] px-5 rounded-2xl text-base font-bold focus-visible:outline-none focus-visible:ring-2"
                      style={{ color: dark, background: mA(0.07), '--tw-ring-color': main } as React.CSSProperties}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleCommentSubmit}
                      disabled={!commentText.trim() || createComment.isPending}
                      aria-busy={createComment.isPending}
                      className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-2xl text-base font-black text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
                      style={{ background: grad, '--tw-ring-color': main } as React.CSSProperties}
                    >
                      <Send size={16} aria-hidden="true" />
                      {createComment.isPending ? '보내는 중...' : '등록'}
                    </button>
                  </div>
                </div>
              )}

              {/* 칭찬카드 패널 */}
              {commentTab === 'praise' && (
                <div className="px-4 py-3 space-y-3">
                  <PraiseCardPicker
                    selectedCard={selectedPraiseCard}
                    onSelect={setSelectedPraiseCard}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setCommentExpanded(false); setSelectedPraiseCard(null); setCommentTab('text') }}
                      className="inline-flex items-center min-h-[44px] px-5 rounded-2xl text-base font-bold focus-visible:outline-none focus-visible:ring-2"
                      style={{ color: dark, background: mA(0.07), '--tw-ring-color': main } as React.CSSProperties}
                    >
                      취소
                    </button>
                    <button
                      onClick={handlePraiseCardSubmit}
                      disabled={!selectedPraiseCard || createComment.isPending}
                      aria-busy={createComment.isPending}
                      className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-2xl text-base font-black text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
                      style={{ background: grad, '--tw-ring-color': main } as React.CSSProperties}
                    >
                      <span aria-hidden="true">💌</span>
                      {createComment.isPending ? '보내는 중...' : '카드 보내기'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 댓글 목록 */}
        <div className="divide-y" style={{ borderColor: mA(0.10) }}>
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
            commentList.map((comment) => {
              const isPraiseCard = comment.commentType === 'PRAISE_CARD'
              const praiseCardMeta = isPraiseCard && comment.praiseCardType
                ? PRAISE_CARDS.find(c => c.type === comment.praiseCardType)
                : null

              return (
                <div
                  key={comment.id}
                  className="rounded-2xl px-6 py-5"
                  style={{
                    background: 'white',
                    border: `1px solid ${mA(0.10)}`,
                    boxShadow: `0 2px 8px ${mA(0.06)}`,
                  }}
                >
                  {/* 작성자 헤더 + 본문 — 유튜브 댓글 레이아웃 */}
                  <div className="flex gap-3 items-center">
                    {/* 아바타 */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-black text-white"
                      style={{ background: grad }}
                      aria-hidden="true"
                    >
                      {comment.nickname[0]}
                    </div>

                    {/* 우측 콘텐츠: 닉네임(1줄) + 본문 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {/* 1행: 닉네임 + 시간 + 더보기 */}
                      <div className="flex items-center gap-2 leading-none">
                        <span className="text-sm font-bold shrink-0" style={{ color: `oklch(0.50 0.03 220)` }}>
                          {comment.nickname}
                        </span>
                        <time
                          className="text-xs font-medium shrink-0"
                          style={{ color: `oklch(0.65 0.02 220)` }}
                          dateTime={comment.createdAt}
                        >
                          {formatRelativeTime(comment.createdAt)}
                        </time>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label="댓글 더보기"
                              className="ml-auto shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
                              style={{ color: `oklch(0.60 0.03 220)` }}
                              onMouseEnter={e => { e.currentTarget.style.background = mA(0.08) }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              <MoreVertical size={16} aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {comment.userId === currentUser?.id ? (
                              <>
                                <DropdownMenuItem onClick={() => { setEditingCommentId(comment.id); setEditText(comment.content ?? '') }}>
                                  <Pencil size={14} className="mr-2" />수정
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteCommentId(comment.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" />삭제
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => setReportCommentId(comment.id)}>
                                <Flag size={14} className="mr-2" />신고
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* 2행: 본문 */}
                      {editingCommentId === comment.id ? (
                        <div className="mt-1 flex gap-2 items-start">
                          <Textarea
                            className="text-sm px-3 py-2 resize-none rounded-xl border-2 focus-visible:ring-0 flex-1"
                            style={{ borderColor: mA(0.45) }}
                            rows={2}
                            maxLength={200}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            autoFocus
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={!editText.trim() || updateComment.isPending}
                              className="px-3 py-1.5 rounded-lg text-xs font-black text-white disabled:opacity-40"
                              style={{ background: grad }}
                            >저장</button>
                            <button
                              onClick={() => { setEditingCommentId(null); setEditText('') }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: mA(0.08), color: dark }}
                            >취소</button>
                          </div>
                        </div>
                      ) : isPraiseCard && praiseCardMeta ? (
                        <div
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 mt-0.5 self-start"
                          style={{ background: praiseCardMeta.bg, border: `1px solid ${praiseCardMeta.borderColor}` }}
                          role="img"
                          aria-label={`칭찬 카드: ${praiseCardMeta.label}`}
                        >
                          <span className="text-sm leading-none" aria-hidden="true">{praiseCardMeta.emoji}</span>
                          <span className="text-xs font-black" style={{ color: praiseCardMeta.color }}>{praiseCardMeta.label}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground leading-snug mt-0.5">
                          {comment.content}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* 답글 달기 + 대댓글 목록 + 입력창 */}
                  <div className="mt-3 ml-[60px] space-y-2">
                    {/* 대댓글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div
                        className="rounded-xl px-4 py-3 space-y-3"
                        style={{ background: mA(0.04), borderLeft: `3px solid ${mA(0.20)}` }}
                      >
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2 items-start">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white"
                              style={{ background: mA(0.45) }}
                              aria-hidden="true"
                            >
                              {reply.nickname[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold shrink-0" style={{ color: `oklch(0.50 0.03 220)` }}>{reply.nickname}</span>
                                <time className="text-xs font-medium shrink-0" style={{ color: `oklch(0.65 0.02 220)` }} dateTime={reply.createdAt}>
                                  {formatRelativeTime(reply.createdAt)}
                                </time>
                              </div>
                              <p className="text-sm text-foreground leading-snug mt-0.5">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 답글 달기 버튼 */}
                    <button
                      onClick={() => setReplyTargetId(replyTargetId === comment.id ? null : comment.id)}
                      className="text-xs font-bold focus-visible:outline-none focus-visible:ring-2 rounded px-2 py-1"
                      style={{ color: mA(0.5), background: mA(0.06) }}
                    >
                      {replyTargetId === comment.id ? '취소' : '↩ 답글 달기'}
                    </button>

                    {/* 답글 입력창 */}
                    {replyTargetId === comment.id && (
                      <div className="flex gap-2 items-start">
                        <Textarea
                          className="text-base px-3 py-2 resize-none rounded-xl border-2 focus-visible:ring-0 flex-1"
                          style={replyText.length > 0 ? { borderColor: mA(0.45) } : { borderColor: mA(0.15) }}
                          rows={2}
                          placeholder="답글을 입력하세요..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          aria-label="답글 입력"
                          autoFocus
                        />
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={!replyText.trim() || createComment.isPending}
                          className="min-h-[44px] px-4 rounded-xl text-sm font-black text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40"
                          style={{ background: grad, '--tw-ring-color': main } as React.CSSProperties}
                        >
                          <Send size={16} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
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

      {/* 댓글 삭제 확인 모달 */}
      {deleteCommentId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'oklch(0 0 0 / 0.50)' }}
          onClick={() => setDeleteCommentId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="댓글 삭제 확인"
        >
          <div
            className="w-full max-w-sm rounded-3xl px-7 py-8 space-y-6"
            style={{ background: 'white', boxShadow: `0 8px 40px ${mA(0.25)}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'oklch(0.95 0.02 25)' }} aria-hidden="true">
                <AlertTriangle size={32} className="text-destructive" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-foreground">댓글을 삭제할까요?</h3>
                <p className="text-base font-medium text-muted-foreground">삭제한 댓글은 복구할 수 없어요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteCommentId(null)}
                className="flex-1 min-h-[52px] rounded-2xl text-lg font-black focus-visible:outline-none focus-visible:ring-2"
                style={{ background: mA(0.08), color: dark }}>취소</button>
              <button type="button" onClick={handleDeleteComment} disabled={deleteComment.isPending}
                className="flex-1 min-h-[52px] rounded-2xl text-lg font-black text-white focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                style={{ background: 'oklch(0.55 0.18 25)' }}>
                {deleteComment.isPending ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 바텀시트 */}
      {reportCommentId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'oklch(0 0 0 / 0.50)' }}
          onClick={() => setReportCommentId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="댓글 신고"
        >
          <div
            className="w-full max-w-lg rounded-t-3xl px-6 pb-10 pt-6 space-y-4"
            style={{ background: 'white', boxShadow: `0 -4px 30px ${mA(0.15)}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-foreground">신고 사유 선택</h3>
              <button onClick={() => setReportCommentId(null)} aria-label="닫기" className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: mA(0.08) }}>
                <XIcon size={18} aria-hidden="true" />
              </button>
            </div>
            {(['SPAM', 'INAPPROPRIATE', 'ABUSE', 'OTHER'] as const).map((reason) => {
              const labels = { SPAM: '스팸', INAPPROPRIATE: '부적절한 내용', ABUSE: '욕설·비하', OTHER: '기타' }
              return (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  disabled={createReport.isPending}
                  className="w-full min-h-[56px] rounded-2xl text-lg font-bold text-left px-5 transition-colors disabled:opacity-50"
                  style={{ background: mA(0.06), color: dark }}
                  onMouseEnter={e => { e.currentTarget.style.background = mA(0.12) }}
                  onMouseLeave={e => { e.currentTarget.style.background = mA(0.06) }}
                >
                  {labels[reason]}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
