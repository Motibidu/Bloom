import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Trash2, Flag, ShieldOff, X } from 'lucide-react'
import { toast } from 'sonner'
import type { PostSummary } from '@/hooks/usePost'
import { useDeletePost } from '@/hooks/usePost'
import { useCreateReport } from '@/hooks/useReport'
import { useBlockUser } from '@/hooks/useBlock'
import { useAuthStore } from '@/store/authStore'

const main = 'oklch(0.62 0.15 220)'
const dark = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

function formatRelativeDate(createdAt: string): string {
  const date = new Date(createdAt)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`
}

const CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  QNA: '질문공간',
  INFO: '정보공유',
}

const REASON_LABELS: Record<string, string> = {
  SPAM: '스팸/도배',
  INAPPROPRIATE: '부적절한 콘텐츠',
  ABUSE: '욕설/혐오 표현',
  OTHER: '기타',
}

interface Props {
  post: PostSummary
  onClick: () => void
}

function DeleteConfirmModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'oklch(0 0 0 / 0.45)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="게시글 삭제 확인"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl px-6 pt-5 pb-8 space-y-5"
        style={{ background: 'white', boxShadow: '0 -8px 40px oklch(0.62 0.15 220 / 0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: mA(0.20) }} aria-hidden="true" />
        <div className="text-center space-y-2 pt-2">
          <h2 className="text-xl font-black text-foreground">게시글을 삭제할까요?</h2>
          <p className="text-base text-foreground/60">삭제한 글은 되돌릴 수 없어요.</p>
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
            onClick={onConfirm}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: 'oklch(0.55 0.18 20)' }}
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  )
}

function ReportModal({ postId, onClose, onSuccess }: { postId: number; onClose: () => void; onSuccess: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const createReport = useCreateReport()
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async () => {
    if (!selected) return
    await createReport.mutateAsync({ targetType: 'POST', targetId: postId, reason: selected as 'SPAM' | 'INAPPROPRIATE' | 'ABUSE' | 'OTHER' })
    onClose()
    onSuccess()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'oklch(0 0 0 / 0.45)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="게시글 신고"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl px-6 pt-5 pb-8 space-y-5"
        style={{ background: 'white', boxShadow: '0 -8px 40px oklch(0.62 0.15 220 / 0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: mA(0.20) }} aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-foreground">신고 사유 선택</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-11 h-11 rounded-xl flex items-center justify-center"
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
          신고하기
        </button>
      </div>
    </div>
  )
}

export default function PostListRow({ post, onClick }: Props) {
  const currentUser = useAuthStore(s => s.user)
  const isOwner = currentUser?.id === post.userId

  const deletePost = useDeletePost(post.id)
  const blockUser = useBlockUser()

  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<React.CSSProperties>({})

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!menuOpen && menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setMenuOpen(prev => !prev)
  }

  const handleDelete = async () => {
    setDeleteConfirmOpen(false)
    await deletePost.mutateAsync()
    toast.success('게시글을 삭제했어요.')
  }

  const handleBlock = async () => {
    await blockUser.mutateAsync(post.userId)
    toast.success(`${post.nickname}님을 차단했습니다.`)
  }

  return (
    <div
      className="relative w-full bg-white border-b"
      style={{ borderColor: mA(0.10) }}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-4 pl-4 pr-12 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{ '--tw-ring-color': dark } as React.CSSProperties}
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-sm font-bold shrink-0"
              style={{ background: mA(0.10), border: `1px solid ${mA(0.22)}`, color: dark }}
            >
              {CATEGORY_LABELS[post.category]}
            </span>
            <h3 className="text-lg font-black text-foreground truncate leading-snug">
              {post.title}
            </h3>
          </div>
          <p className="text-base text-foreground/60 truncate">{post.contentPreview}</p>
          <div className="flex items-center gap-2 text-sm text-foreground/50 font-medium">
            <span>{post.nickname}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{formatRelativeDate(post.createdAt)}</time>
            <span aria-hidden="true">·</span>
            <span>댓글 {post.commentCount}</span>
          </div>
        </div>
        {post.thumbnailUrl && (
          <img
            src={post.thumbnailUrl}
            alt=""
            aria-hidden="true"
            width={72}
            height={72}
            className="rounded-xl object-cover shrink-0"
            style={{ width: 72, height: 72 }}
            loading="lazy"
          />
        )}
      </button>

      {/* 케밥 메뉴 */}
      <button
        ref={menuBtnRef}
        type="button"
        onClick={openMenu}
        aria-label="더 보기 메뉴"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="absolute top-3 right-2 inline-flex items-center justify-center w-11 h-11 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ color: dark, background: menuOpen ? mA(0.10) : 'transparent' }}
      >
        <MoreVertical size={20} aria-hidden="true" />
      </button>

      {menuOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90]"
            aria-hidden="true"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
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
            onClick={e => e.stopPropagation()}
          >
            {isOwner ? (
              <button
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setDeleteConfirmOpen(true) }}
                className="w-full min-h-[48px] flex items-center gap-2.5 px-5 text-base font-bold text-destructive transition-colors text-left"
              >
                <Trash2 size={16} aria-hidden="true" />
                삭제하기
              </button>
            ) : (
              <>
                <button
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setReportOpen(true) }}
                  className="w-full min-h-[48px] flex items-center gap-2.5 px-5 text-base font-bold transition-colors text-left"
                  style={{ color: 'oklch(0.55 0.18 20)' }}
                >
                  <Flag size={16} aria-hidden="true" />
                  신고하기
                </button>
                <button
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); handleBlock() }}
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
        <DeleteConfirmModal onConfirm={handleDelete} onClose={() => setDeleteConfirmOpen(false)} />,
        document.body
      )}

      {reportOpen && createPortal(
        <ReportModal
          postId={post.id}
          onClose={() => setReportOpen(false)}
          onSuccess={() => toast.success('신고가 접수되었습니다.')}
        />,
        document.body
      )}
    </div>
  )
}
