import { useState, useEffect, useRef } from 'react'
import { Users, Copy, Check, Home, ChevronRight, X, LogOut, Bell, ClipboardList, Pen, Link2, UserPlus } from 'lucide-react'
import { isKakaoShareReady } from '@/lib/kakao'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import { useMyFamily, useCreateFamily, useJoinFamily, useFamilyFeed, useLeaveFamilyGroup } from '@/hooks/useFamily'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { type PromptTemplateItem, PROMPT_TEMPLATES } from '@/types/prompt'
import { useSendPrompt, useReceivedPrompts, useDismissPrompt } from '@/hooks/usePrompt'

// ── Warm Blue 테마 ─────────────────────────────────────────────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

const serifStyle: React.CSSProperties = { fontFamily: "'Noto Serif KR', serif" }

type PromptTarget =
  | { type: 'member'; id: number; nickname: string }
  | { type: 'all'; ids: number[] }

// ── 초대 코드 / 링크 공유 블록 ────────────────────────────────────────────────
const INVITE_BASE_URL = 'https://pcgear.store/invite'

function InviteCodeBlock({ inviteCode }: { inviteCode: string }) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const kakaoInitialized = useRef(false)
  const btnId = `kakao-share-btn-${inviteCode}`

  const inviteLink = `${INVITE_BASE_URL}/${inviteCode}`

  useEffect(() => {
    if (kakaoInitialized.current) return
    if (!isKakaoShareReady()) return
    const container = document.getElementById(btnId)
    if (!container) return
    kakaoInitialized.current = true
    window.Kakao.Share.createDefaultButton({
      container,
      objectType: 'feed',
      content: {
        title: '가족으로 초대합니다',
        description: '오늘 뭐 했어요? — 함께 일상을 기록해요.',
        imageUrl: 'https://pcgear.store/og-image.png',
        link: { mobileWebUrl: inviteLink, webUrl: inviteLink },
      },
      buttons: [{ title: '가족으로 합류하기', link: { mobileWebUrl: inviteLink, webUrl: inviteLink } }],
    })
  }, [inviteLink, btnId])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    })
  }

  const handleFallbackShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '가족 초대',
          text: '오늘 뭐 했어요? 서비스에 가족으로 초대합니다.',
          url: inviteLink,
        })
      } catch {
        // 공유 취소 시 무시
      }
    } else {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      })
    }
  }

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: mA(0.06), border: `1.5px solid ${mA(0.15)}` }}
    >
      {/* 코드 행 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-0.5" style={{ color: dark }}>초대 코드</p>
          <p
            className="text-2xl font-black tracking-[0.2em] text-foreground"
            style={serifStyle}
            aria-label={`초대 코드 ${inviteCode}`}
          >
            {inviteCode}
          </p>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 min-h-[48px] px-4 rounded-xl font-bold text-base transition-colors duration-200 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={copiedCode
            ? { background: 'oklch(0.65 0.12 150)', color: 'white' }
            : { background: mA(0.12), color: dark }
          }
          aria-label={copiedCode ? '코드 복사됨' : '초대 코드 복사'}
        >
          {copiedCode ? (
            <><Check size={18} aria-hidden="true" />복사됨</>
          ) : (
            <><Copy size={18} aria-hidden="true" />코드 복사</>
          )}
        </button>
      </div>

      {/* 구분선 */}
      <div className="h-px w-full rounded-full" style={{ background: mA(0.12) }} aria-hidden="true" />

      {/* 링크 공유 행 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-0.5" style={{ color: dark }}>가입 링크</p>
          <p className="text-sm text-foreground/50 truncate">{inviteLink}</p>
        </div>
        {/* 카카오 SDK가 준비된 경우 공식 공유 버튼 마운트, 아닌 경우 폴백 버튼 */}
        {isKakaoShareReady() ? (
          <div
            id={btnId}
            className="min-h-[48px] flex items-center cursor-pointer"
            aria-label="카카오톡으로 공유"
          >
            <img
              src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png"
              alt="카카오톡 공유"
              className="h-12 w-auto"
            />
          </div>
        ) : (
          <button
            onClick={handleFallbackShare}
            className="flex items-center gap-2 min-h-[48px] px-4 rounded-xl font-bold text-base transition-colors duration-200 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={copiedLink
              ? { background: 'oklch(0.65 0.12 150)', color: 'white' }
              : { background: grad, color: 'white' }
            }
            aria-label={copiedLink ? '링크 복사됨' : '링크 공유'}
          >
            {copiedLink ? (
              <><Check size={18} aria-hidden="true" />복사됨</>
            ) : (
              <><Copy size={18} aria-hidden="true" />링크 복사</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ── 가족 피드 ──────────────────────────────────────────────────────────────────
function FamilyFeed({ groupId }: { groupId: number }) {
  const navigate = useNavigate()
  const { data: feed, isLoading, isError } = useFamilyFeed(groupId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${mA(0.25)} ${mA(0.25)} ${mA(0.25)} transparent` }}
          role="status"
          aria-label="가족 피드 불러오는 중"
        />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-base text-foreground/60 font-bold">
        피드를 불러오지 못했어요
      </div>
    )
  }

  if (!feed || feed.checkins.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: mA(0.04), border: `1.5px dashed ${mA(0.2)}` }}
      >
        <Users size={40} className="mx-auto mb-3" style={{ color: mA(0.4) }} aria-hidden="true" />
        <p className="text-base font-bold text-foreground/60">
          아직 가족의 활동이 없어요
        </p>
        <p className="text-sm text-foreground/40 mt-1">
          가족을 초대해 함께 활동을 기록해 보세요
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {feed.checkins.map(checkin => (
        <CheckInCard
          key={checkin.id}
          checkin={checkin}
          onClick={() => navigate(`/checkin/${checkin.id}`)}
        />
      ))}
    </div>
  )
}

// ── 나가기 확인 다이얼로그 ───────────────────────────────────────────────────────
function LeaveConfirmDialog({
  open,
  isOwner,
  isPending,
  onConfirm,
  onCancel,
}: {
  open: boolean
  isOwner: boolean
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full sm:max-w-sm mx-4 sm:mx-auto rounded-3xl bg-white p-7 flex flex-col gap-5 shadow-2xl mb-24 sm:mb-0">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: isOwner ? 'oklch(0.95 0.05 25)' : mA(0.08) }}
          aria-hidden="true"
        >
          <LogOut size={28} style={{ color: isOwner ? 'oklch(0.55 0.2 25)' : dark }} />
        </div>
        <div className="text-center space-y-2">
          <h2
            id="leave-dialog-title"
            className="text-xl font-black text-foreground"
            style={serifStyle}
          >
            {isOwner ? '그룹을 해산할까요?' : '그룹을 나갈까요?'}
          </h2>
          <p className="text-base font-medium text-foreground/60 leading-relaxed">
            {isOwner
              ? '그룹을 해산하면 모든 멤버가 그룹에서 제거되고 복구할 수 없어요.'
              : '그룹에서 나가면 가족 피드를 더 이상 볼 수 없어요.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 min-h-[52px] rounded-2xl text-base font-bold border-2 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: mA(0.25), color: dark }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 min-h-[52px] rounded-2xl text-base font-black text-white transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: isOwner ? 'oklch(0.55 0.2 25)' : grad }}
          >
            {isPending ? '처리 중…' : isOwner ? '해산하기' : '나가기'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 그룹 있는 화면 ─────────────────────────────────────────────────────────────
function FamilyGroupView({ groupId, name, inviteCode, members, isOwner, currentUserId }: {
  groupId: number
  name: string
  inviteCode: string
  members: { userId: number; nickname: string; profileImageUrl: string | null }[]
  isOwner: boolean
  currentUserId: number | null
}) {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const leaveFamily = useLeaveFamilyGroup()
  const [promptTarget, setPromptTarget] = useState<PromptTarget | null>(null)
  const otherMembers = members.filter(m => m.userId !== currentUserId)
  const inviteLink = `${INVITE_BASE_URL}/${inviteCode}`

  const handleKakaoShare = () => {
    if (!isKakaoShareReady()) return
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '가족으로 초대합니다',
        description: '오늘 뭐 했어요? — 함께 일상을 기록해요.',
        imageUrl: 'https://pcgear.store/og-image.png',
        link: { mobileWebUrl: inviteLink, webUrl: inviteLink },
      },
      buttons: [{ title: '가족으로 합류하기', link: { mobileWebUrl: inviteLink, webUrl: inviteLink } }],
    })
  }

  const handleBandShare = () => {
    const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent('오늘 뭐 했어요? 서비스에 가족으로 초대합니다.\n' + inviteLink)}&route=${encodeURIComponent(inviteLink)}`
    window.open(bandUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success('초대 링크를 복사했어요.')
    })
  }

  const handleLeaveConfirm = async () => {
    try {
      await leaveFamily.mutateAsync(groupId)
      toast.success(isOwner ? '가족 그룹을 해산했어요.' : '가족 그룹에서 나왔어요.')
    } catch {
      toast.error('처리에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setLeaveDialogOpen(false)
    }
  }

  return (
    <>
    <LeaveConfirmDialog
      open={leaveDialogOpen}
      isOwner={isOwner}
      isPending={leaveFamily.isPending}
      onConfirm={handleLeaveConfirm}
      onCancel={() => setLeaveDialogOpen(false)}
    />


<div className="flex flex-col gap-4">
      {/* 그룹 헤더 카드 */}
      <div
        className="rounded-3xl p-5"
        style={{ background: grad, boxShadow: `0 8px 32px ${mA(0.25)}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Home size={16} className="text-white/80" aria-hidden="true" />
            <span className="text-white/80 text-sm font-bold">우리 가족</span>
          </div>
          <button
            onClick={() => setLeaveDialogOpen(true)}
            className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl text-sm font-bold [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}
            aria-label={isOwner ? '그룹 해산' : '그룹 나가기'}
          >
            <LogOut size={14} aria-hidden="true" />
            {isOwner ? '해산' : '나가기'}
          </button>
        </div>
        <h1 className="text-2xl font-black text-white mb-3 leading-tight" style={serifStyle}>
          {name}
        </h1>

        {/* 멤버 아바타 목록 — 탭하면 활동 기록 요청 발송 */}
        <div
          className="rounded-2xl px-4 py-3 mb-2"
          style={{ background: 'rgba(255,255,255,0.22)' }}
        >
          {/* 아바타 스크롤 행 */}
          <div className="flex gap-3 overflow-x-auto items-end" style={{ scrollbarWidth: 'none' }}>
          {/* 멤버 아바타 */}
          {members.map(m => {
            const isSelected = promptTarget?.type === 'member' && promptTarget.id === m.userId
            return (
              <div key={m.userId} className="flex flex-col items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    if (m.userId === currentUserId) return
                    setPromptTarget({ type: 'member', id: m.userId, nickname: m.nickname })
                  }}
                  className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white [-webkit-tap-highlight-color:transparent]"
                  aria-label={m.userId !== currentUserId ? `${m.nickname}에게 활동 기록 요청` : undefined}
                  style={{ cursor: m.userId !== currentUserId ? 'pointer' : 'default' }}
                >
                  <div
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-lg font-black shrink-0 overflow-hidden transition-all"
                    style={{
                      background: isSelected ? 'white' : 'rgba(255,255,255,0.40)',
                      color: dark,
                      boxShadow: isSelected ? '0 0 0 3px white' : '0 2px 10px rgba(0,0,0,0.18)',
                    }}
                    aria-hidden="true"
                  >
                    {m.profileImageUrl ? (
                      <img src={m.profileImageUrl} alt={m.nickname} className="w-full h-full object-cover" />
                    ) : (
                      m.nickname[0]
                    )}
                  </div>
                  {m.userId !== currentUserId && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                      aria-hidden="true"
                    >
                      <Bell size={10} style={{ color: main }} />
                    </div>
                  )}
                </button>
                <span className="text-white text-xs font-bold max-w-[52px] text-center truncate">{m.nickname}</span>
              </div>
            )
          })}

          {/* 전체 버튼 — 아바타 열 끝, 멤버 2명 이상일 때만 표시 */}
          {otherMembers.length > 1 && (
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button
                onClick={() => setPromptTarget({ type: 'all', ids: otherMembers.map(m => m.userId) })}
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white [-webkit-tap-highlight-color:transparent]"
                style={{
                  background: promptTarget?.type === 'all' ? 'white' : 'rgba(255,255,255,0.18)',
                  border: `2px dashed ${promptTarget?.type === 'all' ? main : 'rgba(255,255,255,0.6)'}`,
                  boxShadow: promptTarget?.type === 'all' ? '0 0 0 3px white' : 'none',
                }}
                aria-label="전체 멤버에게 활동 기록 요청"
              >
                <Users size={20} style={{ color: promptTarget?.type === 'all' ? main : 'white' }} />
              </button>
              <span className="text-white text-xs font-bold">전체</span>
            </div>
          )}

          </div>{/* /아바타 스크롤 행 */}
        </div>

        {/* 가족 초대 — D안: 레이블 좌측, 버튼 우측, opacity 낮음 */}
        {members.length < 5 && (
          <div className="flex items-center gap-3 mb-2" style={{ opacity: 0.75 }}>
            <span className="text-white text-xs font-bold shrink-0">가족 초대</span>
            <div className="flex gap-2 flex-1">
              {isKakaoShareReady() && (
                <button
                  onClick={handleKakaoShare}
                  className="flex-1 flex items-center justify-center gap-1 min-h-[42px] rounded-xl font-bold text-xs transition-all [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ background: '#FEE500', color: '#191919' }}
                  aria-label="카카오톡으로 초대"
                >
                  <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png" alt="" className="w-4 h-4" aria-hidden="true" />
                  카카오톡
                </button>
              )}
              <button
                onClick={handleBandShare}
                className="flex-1 flex items-center justify-center gap-1 min-h-[42px] rounded-xl font-bold text-xs transition-all [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ background: '#03C75A', color: 'white' }}
                aria-label="네이버 밴드로 초대"
              >
                <img src="https://developers.band.us/assets/img/share/band_share_btn_small.png" alt="" className="w-4 h-4" aria-hidden="true"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                밴드
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-1 min-h-[42px] rounded-xl font-bold text-xs transition-all [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                aria-label="초대 링크 복사"
              >
                <Link2 size={13} aria-hidden="true" />
                링크
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 피드 */}
      <div className="flex flex-col gap-4">
        {promptTarget && (
          <InlinePromptPanel
            target={promptTarget}
            onClose={() => setPromptTarget(null)}
          />
        )}
        <ReceivedPromptBanner />
        <FamilyFeed groupId={groupId} />
      </div>
    </div>
    </>
  )
}

// ── 인라인 활동 기록 요청 패널 ──────────────────────────────────────────────────
function InlinePromptPanel({
  target,
  onClose,
}: {
  target: PromptTarget
  onClose: () => void
}) {
  const sendPrompt = useSendPrompt()
  const [done, setDone] = useState(false)

  const targetLabel = target.type === 'member' ? target.nickname : '가족 전체'

  const purple = 'oklch(0.55 0.18 280)'
  const purpleA = (a: number) => `oklch(0.55 0.18 280 / ${a})`

  const handleSelect = async (templateCode: PromptTemplateItem['code']) => {
    try {
      const ids = target.type === 'member' ? [target.id] : target.ids
      const results = await Promise.allSettled(
        ids.map(id => sendPrompt.mutateAsync({ recipientId: id, templateCode }))
      )
      const failedCount = results.filter(r => r.status === 'rejected').length
      if (failedCount < ids.length) {
        setDone(true)
      }
    } catch {
      // useSendPrompt onError에서 toast 처리
    }
  }

  if (done) {
    return (
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: purpleA(0.07), border: `1px solid ${purpleA(0.2)}` }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: purpleA(0.15) }}
          aria-hidden="true"
        >
          <Check size={18} style={{ color: purple }} />
        </div>
        <p className="font-black text-base flex-1" style={{ color: purple }}>
          {targetLabel}에게 요청을 보냈어요!
        </p>
        <button
          onClick={onClose}
          className="text-sm font-bold min-h-[48px] px-3"
          style={{ color: purpleA(0.6) }}
        >
          닫기
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${purpleA(0.3)}` }}
    >
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: purpleA(0.12) }}>
        <span className="text-sm font-black" style={{ color: purple }}>
          {targetLabel}에게 어떤 요청을 보낼까요?
        </span>
        <button
          onClick={onClose}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="닫기"
        >
          <X size={15} style={{ color: purpleA(0.6) }} />
        </button>
      </div>
      <div className="flex flex-col bg-white">
        {PROMPT_TEMPLATES.map((t: PromptTemplateItem, i) => (
          <button
            key={t.code}
            onClick={() => handleSelect(t.code)}
            disabled={sendPrompt.isPending}
            className="text-left px-4 py-3 font-bold text-base disabled:opacity-50 focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
            style={{
              borderTop: i > 0 ? `1px solid ${purpleA(0.10)}` : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 수신된 프롬프트 배너 ────────────────────────────────────────────────────────
function ReceivedPromptBanner() {
  const navigate = useNavigate()
  const location = useLocation()

  const openPromptId = (location.state as { openPromptId?: number } | null)?.openPromptId
  const { data: receivedPrompts = [] } = useReceivedPrompts()
  const dismissPrompt = useDismissPrompt()

  if (receivedPrompts.length === 0) return null

  // 딥링크로 온 경우 해당 프롬프트를 최상단으로
  const sorted = openPromptId
    ? [receivedPrompts.find(p => p.id === openPromptId), ...receivedPrompts.filter(p => p.id !== openPromptId)].filter(Boolean) as typeof receivedPrompts
    : receivedPrompts

  const purple = 'oklch(0.55 0.18 280)'
  const purpleA = (a: number) => `oklch(0.55 0.18 280 / ${a})`

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${purpleA(0.3)}`, wordBreak: 'keep-all' }}
      role="region"
      aria-label="가족 활동 기록 요청"
    >
      {/* 헤더 */}
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: purpleA(0.12) }}>
        <ClipboardList size={14} style={{ color: purple }} aria-hidden="true" />
        <span className="text-sm font-black" style={{ color: purple }}>
          가족이 활동 기록을 요청했어요
        </span>
        {sorted.length > 1 && (
          <span
            className="ml-1 text-xs font-black px-2 py-0.5 rounded-full text-white"
            style={{ background: purple }}
          >
            {sorted.length}
          </span>
        )}
      </div>

      {/* 요청 목록 */}
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className="px-4 py-3 flex items-center gap-3"
          style={{
            background: i % 2 === 0 ? 'white' : purpleA(0.02),
            borderTop: i > 0 ? `1px solid ${purpleA(0.10)}` : undefined,
          }}
        >
          {/* 아바타 */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
            style={{ background: purpleA(0.15), color: purple }}
            aria-hidden="true"
          >
            {p.senderNickname[0]}
          </div>

          {/* 텍스트 */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black" style={{ color: purple }}>{p.senderNickname}</p>
            <p className="text-sm text-foreground/70 truncate">"{p.templateLabel}"</p>
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/', { state: { promptId: p.id } })}
              className="min-h-[40px] px-3 rounded-xl text-sm font-black text-white flex items-center gap-1.5 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: purple }}
            >
              <Pen size={13} aria-hidden="true" />
              기록
            </button>
            <button
              onClick={() => dismissPrompt.mutate(p.id)}
              disabled={dismissPrompt.isPending}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border-2 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
              style={{ borderColor: purpleA(0.25), color: purpleA(0.5) }}
              aria-label="무시"
            >
              <Check size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}


// ── 그룹 없는 화면 ─────────────────────────────────────────────────────────────
function FamilyEmpty() {
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle')
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createFamily = useCreateFamily()
  const joinFamily = useJoinFamily()

  const handleCreate = async () => {
    const trimmed = groupName.trim()
    if (!trimmed) {
      setError('그룹 이름을 입력해 주세요')
      return
    }
    setError(null)
    try {
      await createFamily.mutateAsync({ name: trimmed })
    } catch {
      setError('그룹 생성에 실패했어요. 다시 시도해 주세요.')
    }
  }

  const handleJoin = async () => {
    const trimmed = inviteCode.trim().toUpperCase()
    if (!trimmed) {
      setError('초대 코드를 입력해 주세요')
      return
    }
    setError(null)
    try {
      await joinFamily.mutateAsync({ inviteCode: trimmed })
    } catch {
      setError('올바른 초대 코드를 확인해 주세요.')
    }
  }

  const isPending = createFamily.isPending || joinFamily.isPending

  return (
    <div className="flex flex-col items-center gap-8 pt-4">
      {/* 일러스트 + 타이틀 */}
      <div className="text-center">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: `linear-gradient(135deg, ${mA(0.12)}, ${mA(0.06)})`,
            border: `2px solid ${mA(0.2)}`,
          }}
          aria-hidden="true"
        >
          <Users size={52} style={{ color: main }} />
        </div>
        <h1
          className="text-3xl font-black text-foreground mb-2"
          style={serifStyle}
        >
          가족과 함께해요
        </h1>
        <p className="text-base text-foreground/60 font-bold leading-relaxed">
          가족 그룹을 만들거나 초대 코드로<br />
          가족과 일상을 나눠 보세요
        </p>
      </div>

      {/* 인라인 폼 — 그룹 만들기 */}
      {mode === 'create' && (
        <div
          className="w-full rounded-2xl p-5 flex flex-col gap-4"
          style={{
            background: mA(0.05),
            border: `1.5px solid ${mA(0.15)}`,
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground" style={serifStyle}>새 가족 그룹 만들기</h2>
            <button
              onClick={() => { setMode('idle'); setError(null); setGroupName('') }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl [-webkit-tap-highlight-color:transparent]"
              aria-label="닫기"
            >
              <X size={20} className="text-foreground/50" />
            </button>
          </div>
          <div>
            <label htmlFor="group-name" className="block text-base font-bold text-foreground/80 mb-2">
              그룹 이름
            </label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="예: 우리 가족, 박씨 가족"
              className="w-full min-h-[52px] rounded-xl px-4 text-base font-bold border-2 bg-white focus:outline-none transition-colors"
              style={{
                borderColor: groupName ? main : mA(0.25),
              }}
              maxLength={20}
              aria-describedby={error ? 'form-error' : undefined}
            />
          </div>
          {error && (
            <p id="form-error" className="text-sm font-bold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">
              {error}
            </p>
          )}
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="min-h-[56px] w-full rounded-2xl text-lg font-black text-white transition-opacity disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
            style={{ background: grad }}
          >
            {isPending ? '만드는 중...' : '그룹 만들기'}
          </button>
        </div>
      )}

      {/* 인라인 폼 — 코드 입력 */}
      {mode === 'join' && (
        <div
          className="w-full rounded-2xl p-5 flex flex-col gap-4"
          style={{
            background: mA(0.05),
            border: `1.5px solid ${mA(0.15)}`,
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground" style={serifStyle}>초대 코드로 가입하기</h2>
            <button
              onClick={() => { setMode('idle'); setError(null); setInviteCode('') }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl [-webkit-tap-highlight-color:transparent]"
              aria-label="닫기"
            >
              <X size={20} className="text-foreground/50" />
            </button>
          </div>
          <div>
            <label htmlFor="invite-code" className="block text-base font-bold text-foreground/80 mb-2">
              초대 코드
            </label>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="예: ABCD1234"
              className="w-full min-h-[52px] rounded-xl px-4 text-xl font-black tracking-[0.15em] border-2 bg-white focus:outline-none transition-colors uppercase"
              style={{
                borderColor: inviteCode ? main : mA(0.25),
              }}
              maxLength={12}
              aria-describedby={error ? 'join-error' : undefined}
            />
          </div>
          {error && (
            <p id="join-error" className="text-sm font-bold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">
              {error}
            </p>
          )}
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="min-h-[56px] w-full rounded-2xl text-lg font-black text-white transition-opacity disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
            style={{ background: grad }}
          >
            {isPending ? '가입 중...' : '가입하기'}
          </button>
        </div>
      )}

      {/* CTA 버튼 목록 */}
      {mode === 'idle' && (
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => setMode('create')}
            className="w-full min-h-[64px] rounded-2xl text-xl font-black text-white flex items-center justify-between px-6 [-webkit-tap-highlight-color:transparent]"
            style={{ background: grad, boxShadow: `0 4px 20px ${mA(0.3)}` }}
          >
            <span className="flex items-center gap-3">
              <Home size={24} aria-hidden="true" />
              새 가족 그룹 만들기
            </span>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full min-h-[64px] rounded-2xl text-xl font-black flex items-center justify-between px-6 border-2 bg-white [-webkit-tap-highlight-color:transparent]"
            style={{ borderColor: main, color: dark }}
          >
            <span className="flex items-center gap-3">
              <UserPlus size={24} aria-hidden="true" />
              초대 코드 입력하기
            </span>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────────
export default function FamilyPage() {
  const { data: family, isLoading, isError, error } = useMyFamily()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]" aria-live="polite" aria-label="불러오는 중">
        <div
          className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${mA(0.25)} ${mA(0.25)} ${mA(0.25)} transparent` }}
          role="status"
        />
      </div>
    )
  }

  // 404 → 그룹 없음
  const is404 = isError && (error as { response?: { status?: number } })?.response?.status === 404

  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem('auth-storage')
      return raw ? (JSON.parse(raw)?.state?.user?.id ?? null) : null
    } catch { return null }
  })()
  const myMembership = family?.members.find(m => m.userId === currentUserId)
  const isOwner = myMembership?.role === 'OWNER'

  return (
    <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
      {family ? (
        <FamilyGroupView
          groupId={family.id}
          name={family.name}
          inviteCode={family.inviteCode}
          members={family.members}
          isOwner={isOwner}
          currentUserId={currentUserId}
        />
      ) : is404 || isError ? (
        <FamilyEmpty />
      ) : null}
    </main>
  )
}
