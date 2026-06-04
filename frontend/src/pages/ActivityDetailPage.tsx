import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Send, X as XIcon, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import PraiseCardPicker, { PRAISE_CARDS } from '@/components/ui/domain/checkin/praise-card-picker'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { useCheckinDetail, useDeleteCheckin } from '@/hooks/useCheckin'
import { useComments, useCreateComment } from '@/hooks/useComment'
import { useAuthStore } from '@/store/authStore'
import { useScrollContainer } from '@/lib/scrollContext'
import { isKakaoShareReady } from '@/lib/kakao'
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


export default function ActivityDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const checkinId = Number(id)

  const [commentText, setCommentText] = useState('')
  const [commentTab, setCommentTab] = useState<'text' | 'praise'>('text')
  const [selectedPraiseCard, setSelectedPraiseCard] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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

  const handleDeleteConfirm = () => {
    deleteCheckin.mutate(undefined, {
      onSuccess: () => navigate('/'),
    })
  }

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return
    createComment.mutate({ content: commentText.trim(), commentType: 'TEXT' }, {
      onSuccess: () => setCommentText(''),
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
        },
      }
    )
  }

  const handleShare = async (c: CheckIn) => {
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
      return
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: c.title, url })
      } catch {
        // 사용자가 공유 시트를 닫으면 무시
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('링크를 복사했어요')
    } catch {
      toast.error('링크 복사에 실패했어요')
    }
  }

  const handleBandShare = (c: CheckIn) => {
    const url = `${window.location.origin}/share/checkin/${c.id}`
    const body = encodeURIComponent(`${c.nickname}님의 활동: ${c.title}\n${url}`)
    const route = encodeURIComponent(url)
    window.open(`https://band.us/share?body=${body}&route=${route}`, '_blank', 'noopener,noreferrer')
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
    <main className="max-w-2xl mx-auto px-4 md:px-6 pt-5 pb-10 space-y-6">

      {/* ── 상단 바: 뒤로가기 ──────────────────────────────────────────────────── */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate('/')}
          aria-label="피드로 돌아가기"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2 py-1 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: dark, '--tw-ring-color': main } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.background = mA(0.08) }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-base font-bold">피드로 돌아가기</span>
        </button>
      </div>

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
      <div className="flex gap-3">
        {/* 카카오톡 */}
        <button
          onClick={() => handleShare(checkin)}
          aria-label="카카오톡으로 이 활동 공유하기"
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[56px] rounded-2xl text-base font-black transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: '#FEE500', color: 'rgba(0,0,0,0.85)', '--tw-ring-color': '#FEE500' } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <img
            src="/kakao/kakaotalk_sharing_btn_medium.png"
            alt=""
            width={22}
            height={22}
            aria-hidden="true"
          />
          <span>카카오톡</span>
        </button>

        {/* 네이버 밴드 */}
        <button
          onClick={() => handleBandShare(checkin)}
          aria-label="네이버 밴드로 이 활동 공유하기"
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[56px] rounded-2xl text-base font-black transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: '#00ee65', color: 'rgba(0,0,0,0.85)', '--tw-ring-color': '#00ee65' } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <img
            src="/band/band_icon.png"
            alt=""
            width={22}
            height={22}
            aria-hidden="true"
          />
          <span>밴드</span>
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
            commentList.map((comment) => {
              const isPraiseCard = comment.commentType === 'PRAISE_CARD'
              const praiseCardMeta = isPraiseCard && comment.praiseCardType
                ? PRAISE_CARDS.find(c => c.type === comment.praiseCardType)
                : null

              return (
                <div
                  key={comment.id}
                  className="rounded-2xl px-6 py-5 space-y-2"
                  style={{
                    background: 'white',
                    border: `1px solid ${mA(0.10)}`,
                    boxShadow: `0 2px 8px ${mA(0.06)}`,
                  }}
                >
                  {/* 작성자 헤더 */}
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

                  {/* 칭찬 카드 렌더링 */}
                  {isPraiseCard && praiseCardMeta ? (
                    <div className="pl-12 space-y-1.5">
                      <div
                        className="inline-flex items-center gap-3 rounded-2xl px-5 py-3"
                        style={{
                          background: praiseCardMeta.bg,
                          border: `1.5px solid ${praiseCardMeta.borderColor}`,
                        }}
                        role="img"
                        aria-label={`칭찬 카드: ${praiseCardMeta.label}`}
                      >
                        <span className="text-2xl leading-none" aria-hidden="true">
                          {praiseCardMeta.emoji}
                        </span>
                        <span
                          className="text-base font-black"
                          style={{ color: praiseCardMeta.color }}
                        >
                          {praiseCardMeta.label}
                        </span>
                      </div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: `oklch(0.60 0.04 220)` }}
                      >
                        칭찬 카드를 보냈어요 <span aria-hidden="true">💌</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-base font-medium text-foreground/80 leading-relaxed pl-12">
                      {comment.content}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 댓글 입력 */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'white',
            border: `2px solid ${mA(0.18)}`,
            boxShadow: `0 2px 12px ${mA(0.08)}`,
          }}
        >
          {/* 탭 */}
          <div
            className="flex gap-2 p-3"
            style={{ background: mA(0.04), borderBottom: `1px solid ${mA(0.10)}` }}
            role="tablist"
            aria-label="댓글 유형 선택"
          >
            <button
              role="tab"
              aria-selected={commentTab === 'text'}
              aria-controls="comment-panel-text"
              onClick={() => setCommentTab('text')}
              className="flex items-center gap-2 min-h-[44px] px-5 rounded-xl text-base font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                background: commentTab === 'text' ? grad : mA(0.08),
                color: commentTab === 'text' ? 'white' : dark,
                '--tw-ring-color': main,
              } as React.CSSProperties}
            >
              <span aria-hidden="true">💬</span>
              댓글 쓰기
            </button>
            <button
              role="tab"
              aria-selected={commentTab === 'praise'}
              aria-controls="comment-panel-praise"
              onClick={() => setCommentTab('praise')}
              className="flex items-center gap-2 min-h-[44px] px-5 rounded-xl text-base font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                background: commentTab === 'praise' ? grad : mA(0.08),
                color: commentTab === 'praise' ? 'white' : dark,
                '--tw-ring-color': main,
              } as React.CSSProperties}
            >
              <span aria-hidden="true">💌</span>
              칭찬 카드
            </button>
          </div>

          {/* 탭 패널: 댓글 쓰기 */}
          <div
            id="comment-panel-text"
            role="tabpanel"
            aria-label="댓글 쓰기"
            hidden={commentTab !== 'text'}
            className="p-5 space-y-4"
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

          {/* 탭 패널: 칭찬 카드 */}
          <div
            id="comment-panel-praise"
            role="tabpanel"
            aria-label="칭찬 카드 선택"
            hidden={commentTab !== 'praise'}
            className="p-5 space-y-4"
          >
            <PraiseCardPicker
              selectedCard={selectedPraiseCard}
              onSelect={setSelectedPraiseCard}
            />
            <div className="flex justify-end">
              <button
                onClick={handlePraiseCardSubmit}
                disabled={!selectedPraiseCard || createComment.isPending}
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
                <span aria-hidden="true">💌</span>
                {createComment.isPending ? '보내는 중...' : '카드 보내기'}
              </button>
            </div>
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
