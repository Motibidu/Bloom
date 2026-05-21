import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Eye, MessageCircle, MoreVertical, PlusCircle, Pencil, Trash2, X, Check, Flag, ShieldOff, CheckCircle2 } from 'lucide-react'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/categories'
import ReactionPicker from '@/components/ui/domain/checkin/reaction-picker'
import { useLikeToggle, useUpdateCheckin } from '@/hooks/useCheckin'
import { useCreateReport } from '@/hooks/useReport'
import { useBlockUser } from '@/hooks/useBlock'
import { useToast } from '@/hooks/useToast'
import type { CheckIn, Category } from '@/types'

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
  onAlsoCheckin?: () => void
}

// ── 수정 모달 ────────────────────────────────────────────────────────────────
function EditModal({
  checkin,
  onClose,
}: {
  checkin: CheckIn
  onClose: () => void
}) {
  const [editCategory, setEditCategory] = useState<Category>(checkin.category)
  const [editTitle, setEditTitle] = useState(checkin.title)
  const [editDesc, setEditDesc] = useState(checkin.description)
  const updateCheckin = useUpdateCheckin(checkin.id)
  const overlayRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 모달 열릴 때 textarea 포커스
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async () => {
    if (!editTitle.trim() || !editDesc.trim()) return
    await updateCheckin.mutateAsync({ category: editCategory, title: editTitle.trim(), description: editDesc.trim() })
    onClose()
  }

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
      aria-label="체크인 수정"
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl flex flex-col max-h-[88dvh]"
        style={{ background: 'white', boxShadow: `0 -8px 40px oklch(0.62 0.15 220 / 0.18)` }}
        onClick={e => e.stopPropagation()}
      >
        {/* 고정 헤더 */}
        <div className="px-6 pt-5 pb-4 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: mA(0.20) }} aria-hidden="true" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">활동 수정하기</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="수정 취소"
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: mA(0.06), color: dark }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-5">
          {/* 카테고리 선택 */}
          <div className="space-y-2">
            <p className="text-base font-bold" style={{ color: dark }}>카테고리</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_ORDER.map(cat => {
                const { icon: CatIcon, label } = CATEGORY_META[cat]
                const isSelected = editCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEditCategory(cat)}
                    aria-pressed={isSelected}
                    aria-label={label}
                    className="flex flex-col items-center gap-1 min-h-[60px] rounded-2xl px-2 py-3 transition-all focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: isSelected ? `linear-gradient(135deg, ${main}, ${light})` : mA(0.06),
                      border: isSelected ? 'none' : `1px solid ${mA(0.12)}`,
                      color: isSelected ? 'white' : dark,
                      boxShadow: isSelected ? `0 4px 12px ${mA(0.30)}` : 'none',
                      transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    }}
                  >
                    <CatIcon size={20} aria-hidden="true" />
                    <span className="text-xs font-bold leading-none">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 제목 입력 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-title" className="text-base font-bold" style={{ color: dark }}>
                제목
              </label>
              <span className="text-sm font-medium text-foreground/50" aria-live="polite">
                {editTitle.length}/50
              </span>
            </div>
            <input
              id="edit-title"
              type="text"
              maxLength={50}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="활동 제목을 입력해 주세요"
              className="w-full rounded-2xl px-4 py-3 text-base text-foreground leading-relaxed outline-none border-2 transition-colors"
              style={{
                borderColor: editTitle.length > 0 ? mA(0.45) : mA(0.15),
                background: mA(0.03),
              }}
            />
          </div>

          {/* 설명 입력 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-description" className="text-base font-bold" style={{ color: dark }}>
                내용
              </label>
              <span className="text-sm font-medium text-foreground/50" aria-live="polite">
                {editDesc.length}/300
              </span>
            </div>
            <textarea
              ref={textareaRef}
              id="edit-description"
              rows={4}
              maxLength={300}
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="활동 내용을 입력해 주세요"
              className="w-full resize-none rounded-2xl px-4 py-3 text-base text-foreground leading-relaxed outline-none border-2 transition-colors"
              style={{
                borderColor: editDesc.length > 0 ? mA(0.45) : mA(0.15),
                background: mA(0.03),
              }}
            />
          </div>

          {/* 저장 버튼 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!editTitle.trim() || !editDesc.trim() || updateCheckin.isPending}
            className="w-full min-h-[56px] rounded-2xl text-lg font-black text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity focus-visible:outline-none focus-visible:ring-2"
            style={{ background: `linear-gradient(135deg, ${main}, ${light})` }}
            aria-label={updateCheckin.isPending ? '저장하는 중이에요' : '수정 저장하기'}
          >
            {updateCheckin.isPending ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
            ) : (
              <><Check size={20} aria-hidden="true" /><span>저장하기</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
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
      aria-label="활동 삭제 확인"
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
          <h2 className="text-xl font-black text-foreground">활동을 삭제할까요?</h2>
          <p className="text-base text-foreground/60">삭제한 활동은 되돌릴 수 없어요.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black transition-colors focus-visible:outline-none focus-visible:ring-2 [-webkit-tap-highlight-color:transparent]"
            style={{ background: mA(0.08), color: dark }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 [-webkit-tap-highlight-color:transparent]"
            style={{ background: 'oklch(0.55 0.18 20)' }}
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  )
}

const REASON_LABELS: Record<string, string> = {
  SPAM: '스팸/도배',
  INAPPROPRIATE: '부적절한 콘텐츠',
  ABUSE: '욕설/혐오 표현',
  OTHER: '기타',
}

// ── 신고 모달 ────────────────────────────────────────────────────────────────
function ReportModal({
  checkinId,
  onClose,
  onSuccess,
}: {
  checkinId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const createReport = useCreateReport()
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async () => {
    if (!selected) return
    await createReport.mutateAsync({ targetType: 'CHECKIN', targetId: checkinId, reason: selected as 'SPAM' | 'INAPPROPRIATE' | 'ABUSE' | 'OTHER' })
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
      aria-label="활동 신고"
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
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-base font-bold text-left transition-all"
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
                {selected === value && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: mA(1) }} />
                )}
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
          {createReport.isPending ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
          ) : '신고하기'}
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
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
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
          <p className="text-base text-foreground/60">차단하면 이 분의 활동이 피드에서 보이지 않아요.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black transition-colors"
            style={{ background: mA(0.08), color: dark }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={blockUser.isPending}
            className="flex-1 min-h-[56px] rounded-2xl text-lg font-black text-white disabled:opacity-40 transition-opacity"
            style={{ background: 'oklch(0.55 0.18 20)' }}
          >
            {blockUser.isPending ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin mx-auto" aria-hidden="true" />
            ) : '차단하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CheckInCard({
  checkin,
  onClick,
  showFullContent = false,
  isOwner = false,
  onDelete,
  onPhotoClick,
  commentCount,
  onAlsoCheckin,
}: Props) {
  const { icon: Icon, label } = CATEGORY_META[checkin.category]
  const likeToggle = useLikeToggle(checkin.id)
  const { toasts, show: showToast, dismiss } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)

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
            className="w-12 h-12 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-lg font-black"
            style={checkin.profileImageUrl ? { boxShadow: `0 2px 8px ${mA(0.25)}` } : { background: grad, color: 'white', boxShadow: `0 2px 8px ${mA(0.25)}` }}
            aria-label={`${checkin.nickname} 아바타`}
          >
            {checkin.profileImageUrl ? (
              <img src={checkin.profileImageUrl} alt={`${checkin.nickname} 프로필`} className="w-full h-full object-cover" />
            ) : (
              <span aria-hidden="true">{checkin.nickname[0]}</span>
            )}
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

          {/* 수정/삭제 케밥 메뉴 (소유자 전용) */}
          {isOwner && (
            <div className="relative z-10">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev) }}
                aria-label="더 보기 메뉴"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [-webkit-tap-highlight-color:transparent]"
                style={{ color: dark, background: menuOpen ? mA(0.10) : 'transparent' }}
              >
                <MoreVertical size={20} aria-hidden="true" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-20 min-w-[140px] rounded-2xl py-1.5 overflow-hidden"
                    style={{ background: 'white', border: `1px solid ${mA(0.15)}`, boxShadow: `0 8px 24px ${mA(0.18)}` }}
                  >
                    <button
                      role="menuitem"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-5 py-3.5 text-base font-bold transition-colors text-left [-webkit-tap-highlight-color:transparent]"
                      style={{ color: dark }}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      수정하기
                    </button>
                    {onDelete && (
                      <button
                        role="menuitem"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setDeleteConfirmOpen(true) }}
                        className="w-full flex items-center gap-2.5 px-5 py-3.5 text-base font-bold text-destructive transition-colors text-left [-webkit-tap-highlight-color:transparent]"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        삭제하기
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 신고/차단 케밥 메뉴 (비소유자 전용) */}
          {!isOwner && (
            <div className="relative z-10">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev) }}
                aria-label="더 보기 메뉴"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [-webkit-tap-highlight-color:transparent]"
                style={{ color: dark, background: menuOpen ? mA(0.10) : 'transparent' }}
              >
                <MoreVertical size={20} aria-hidden="true" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-20 min-w-[140px] rounded-2xl py-1.5 overflow-hidden"
                    style={{ background: 'white', border: `1px solid ${mA(0.15)}`, boxShadow: `0 8px 24px ${mA(0.18)}` }}
                  >
                    <button
                      role="menuitem"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setReportOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-5 py-3.5 text-base font-bold transition-colors text-left [-webkit-tap-highlight-color:transparent]"
                      style={{ color: 'oklch(0.55 0.18 20)' }}
                    >
                      <Flag size={16} aria-hidden="true" />
                      신고하기
                    </button>
                    <button
                      role="menuitem"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setBlockOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-5 py-3.5 text-base font-bold text-destructive transition-colors text-left [-webkit-tap-highlight-color:transparent]"
                    >
                      <ShieldOff size={16} aria-hidden="true" />
                      차단하기
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

      {/* 본문 + 사진 wrapper */}
      <div className={`flex-1 flex flex-col ${showFullContent ? 'min-h-[200px]' : 'min-h-[160px]'}`}>
        {/* 본문 */}
        <div className="pl-7 pr-5 pt-4 pb-5">
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
      </div>

      {/* 수정 모달 — overflow:hidden 제약 탈출을 위해 portal로 body에 렌더링 */}
      {editOpen && createPortal(
        <EditModal checkin={checkin} onClose={() => setEditOpen(false)} />,
        document.body
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirmOpen && createPortal(
        <DeleteConfirmModal
          onConfirm={() => { setDeleteConfirmOpen(false); onDelete?.() }}
          onClose={() => setDeleteConfirmOpen(false)}
        />,
        document.body
      )}

      {/* 신고 모달 */}
      {reportOpen && createPortal(
        <ReportModal
          checkinId={checkin.id}
          onClose={() => setReportOpen(false)}
          onSuccess={() => showToast('신고가 접수되었습니다.')}
        />,
        document.body
      )}

      {/* 차단 확인 모달 */}
      {blockOpen && createPortal(
        <BlockConfirmModal
          targetUserId={checkin.userId}
          nickname={checkin.nickname}
          onClose={() => setBlockOpen(false)}
          onSuccess={() => showToast(`${checkin.nickname}님을 차단했습니다.`)}
        />,
        document.body
      )}

      {/* Toast 알림 */}
      {toasts.length > 0 && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-base font-bold text-white pointer-events-auto"
              style={{ background: 'oklch(0.30 0.05 220 / 0.92)', boxShadow: '0 4px 20px oklch(0 0 0 / 0.25)', backdropFilter: 'blur(8px)' }}
              onClick={() => dismiss(t.id)}
            >
              <CheckCircle2 size={20} aria-hidden="true" style={{ color: 'oklch(0.76 0.12 220)' }} />
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* 하단 반응 바 */}
      <div
        className="px-5 flex items-center relative mt-auto"
        style={{
          borderTop: `1px solid ${mA(0.10)}`,
          background: `linear-gradient(to right, ${mA(0.03)}, transparent)`,
        }}
      >
        {/* 왼쪽: 반응·댓글·나도했어요·조회수 */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ReactionPicker
            checkinId={checkin.id}
            myReactionType={checkin.myReactionType ?? null}
            reactionCounts={checkin.reactionCounts ?? {}}
            onReact={(reactionType) => likeToggle.mutate({ reactionType })}
            disabled={likeToggle.isPending}
          />

          <div
            className="flex items-center gap-1 min-h-[44px] shrink-0"
            style={{ color: `oklch(0.55 0.05 220)` }}
            aria-label={`댓글 ${commentCount ?? checkin.commentCount}개`}
          >
            <MessageCircle size={20} aria-hidden="true" />
            <span className="text-sm font-bold" aria-hidden="true">{commentCount ?? checkin.commentCount}</span>
          </div>

          {onAlsoCheckin && (
            <button
              type="button"
              className="relative z-10 flex items-center gap-1 min-h-[44px] px-2 rounded-xl font-bold text-sm transition-colors whitespace-nowrap shrink-0"
              style={{ color: dark }}
              onClick={(e) => { e.stopPropagation(); onAlsoCheckin() }}
              aria-label="나도 했어요 — 같은 카테고리로 즉시 기록"
              onMouseEnter={e => { e.currentTarget.style.background = mA(0.08) }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <PlusCircle size={18} aria-hidden="true" />
              <span>나도 했어요</span>
            </button>
          )}

          <span
            className="flex items-center gap-1 min-h-[44px] shrink-0"
            style={{ color: `oklch(0.65 0.03 220)` }}
          >
            <Eye size={20} aria-hidden="true" />
            <span className="text-sm font-bold">
              <span className="sr-only">조회 </span>
              {checkin.viewCount}
              <span className="sr-only">회</span>
            </span>
          </span>
        </div>

        {/* 오른쪽: 카테고리 아이콘 */}
        <div className="shrink-0 flex items-center pointer-events-none pl-4" aria-hidden="true">
          <Icon size={28} style={{ color: lA(0.18) }} />
        </div>
      </div>
    </article>
  )
}
