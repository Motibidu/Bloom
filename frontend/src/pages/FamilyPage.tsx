import { useState, useEffect, useRef } from 'react'
import { Users, Copy, Check, UserPlus, Home, ChevronRight, X, LogOut, Send, ChevronLeft, ClipboardList, Pen } from 'lucide-react'
import { isKakaoShareReady } from '@/lib/kakao'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import { useMyFamily, useCreateFamily, useJoinFamily, useFamilyFeed, useLeaveFamilyGroup } from '@/hooks/useFamily'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/shadcn/sheet'
import { type PromptDirection, type PromptTemplateItem, PROMPT_TEMPLATES } from '@/types/prompt'
import { useSendPrompt, useReceivedPrompts } from '@/hooks/usePrompt'

// ── Warm Blue 테마 ─────────────────────────────────────────────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

const serifStyle: React.CSSProperties = { fontFamily: "'Noto Serif KR', serif" }

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
  const [tab, setTab] = useState<'feed' | 'settings'>('feed')
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [promptSheetOpen, setPromptSheetOpen] = useState(false)
  const leaveFamily = useLeaveFamilyGroup()

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
    <PromptSheet
      open={promptSheetOpen}
      onClose={() => setPromptSheetOpen(false)}
      members={members}
      currentUserId={currentUserId}
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

        {/* 멤버 아바타 목록 */}
        <div
          className="rounded-2xl px-4 py-3 flex gap-4 overflow-x-auto mb-4"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          {members.map(m => (
            <div key={m.userId} className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.35)', color: dark, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                aria-hidden="true"
              >
                {m.profileImageUrl ? (
                  <img src={m.profileImageUrl} alt={m.nickname} className="w-full h-full object-cover" />
                ) : (
                  m.nickname[0]
                )}
              </div>
              <span className="text-white text-xs font-bold max-w-[52px] text-center truncate">{m.nickname}</span>
            </div>
          ))}
        </div>

        {/* 탭 바 */}
        <div className="flex gap-2" role="tablist">
          {([['feed', '가족 피드'], ['settings', '그룹 설정']] as const).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className="flex-1 min-h-[44px] rounded-xl text-base font-black transition-all [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={tab === key
                ? { background: 'white', color: dark }
                : { background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 가족 피드 탭 */}
      {tab === 'feed' && (
        <div className="flex flex-col gap-4" role="tabpanel">
          <ReceivedPromptBanner />
          <FamilyFeed groupId={groupId} />
        </div>
      )}

      {/* 그룹 설정 탭 */}
      {tab === 'settings' && (
        <div className="flex flex-col gap-4" role="tabpanel">
          <InviteCodeBlock inviteCode={inviteCode} />
          <button
            onClick={() => setPromptSheetOpen(true)}
            className="w-full min-h-[56px] rounded-2xl text-lg font-black text-white flex items-center justify-center gap-3 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: grad, boxShadow: `0 4px 20px ${mA(0.25)}` }}
          >
            <Send size={20} aria-hidden="true" />
            공유 초대 보내기
          </button>
        </div>
      )}
    </div>
    </>
  )
}

// ── 수신된 프롬프트 배너 ────────────────────────────────────────────────────────
function ReceivedPromptBanner() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dismissedIds, setDismissedIds] = useState<number[]>([])

  const openPromptId = (location.state as { openPromptId?: number } | null)?.openPromptId
  const { data: receivedPrompts = [] } = useReceivedPrompts()

  const visible = receivedPrompts.filter(p => !dismissedIds.includes(p.id))
  if (visible.length === 0) return null

  // 딥링크로 온 경우 해당 프롬프트를 최상단으로
  const sorted = openPromptId
    ? [visible.find(p => p.id === openPromptId), ...visible.filter(p => p.id !== openPromptId)].filter(Boolean) as typeof visible
    : visible

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
              onClick={() => navigate('/')}
              className="min-h-[40px] px-3 rounded-xl text-sm font-black text-white flex items-center gap-1.5 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: purple }}
            >
              <Pen size={13} aria-hidden="true" />
              기록
            </button>
            <button
              onClick={() => setDismissedIds(prev => [...prev, p.id])}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border-2 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ borderColor: purpleA(0.25), color: purpleA(0.5) }}
              aria-label="완료"
            >
              <Check size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 프롬프트 발송 바텀시트 ─────────────────────────────────────────────────────
type PromptStep = 'direction' | 'template' | 'confirm'

function PromptSheet({
  open,
  onClose,
  members,
  currentUserId,
}: {
  open: boolean
  onClose: () => void
  members: { userId: number; nickname: string }[]
  currentUserId: number | null
}) {
  const [step, setStep] = useState<PromptStep>('direction')
  const [direction, setDirection] = useState<PromptDirection | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplateItem | null>(null)

  const sendPrompt = useSendPrompt()
  const otherMembers = members.filter(m => m.userId !== currentUserId)
  const recipient = otherMembers[0]

  const directionLabel = direction === 'CHILD_TO_PARENT' ? '부모님께' : '자녀에게'

  function handleClose() {
    setStep('direction')
    setDirection(null)
    setSelectedTemplate(null)
    onClose()
  }

  function handleSelectDirection(d: PromptDirection) {
    setDirection(d)
    setStep('template')
  }

  function handleSelectTemplate(t: PromptTemplateItem) {
    setSelectedTemplate(t)
    setStep('confirm')
  }

  async function handleSend() {
    if (!direction || !selectedTemplate || !recipient) return
    await sendPrompt.mutateAsync({
      recipientId: recipient.userId,
      direction,
      templateCode: selectedTemplate.code,
    })
    handleClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] overflow-y-auto px-6 pb-8">
        <SheetTitle className="sr-only">
          {step === 'direction' ? '공유 초대 보내기' : step === 'template' ? '어떤 내용을 물어볼까요?' : '이렇게 보낼게요'}
        </SheetTitle>
        <div className="flex items-center justify-between pt-2 pb-4">
          <div className="flex items-center gap-2">
            {step !== 'direction' && (
              <button
                onClick={() => setStep(step === 'confirm' ? 'template' : 'direction')}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ color: dark }}
                aria-label="이전 단계"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-black text-foreground" style={serifStyle}>
              {step === 'direction' && '공유 초대 보내기'}
              {step === 'template' && '어떤 내용을 물어볼까요?'}
              {step === 'confirm' && '이렇게 보낼게요'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl [-webkit-tap-highlight-color:transparent]"
            aria-label="닫기"
          >
            <X size={20} className="text-foreground/50" />
          </button>
        </div>

        {/* Step 1: 방향 선택 */}
        {step === 'direction' && (
          <div className="flex flex-col gap-3">
            <p className="text-base text-foreground/60 font-bold mb-2" style={{ wordBreak: 'keep-all' }}>
              누구에게 일상을 공유해달라고 할까요?
            </p>
            <button
              onClick={() => handleSelectDirection('CHILD_TO_PARENT')}
              className="w-full min-h-[72px] rounded-2xl px-5 flex items-center gap-4 text-left [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: mA(0.07), border: `2px solid ${mA(0.15)}` }}
            >
              <span className="text-3xl" aria-hidden="true">👴</span>
              <div>
                <p className="text-lg font-black text-foreground" style={{ wordBreak: 'keep-all' }}>부모님께 초대 보내기</p>
                <p className="text-sm text-foreground/60 font-bold">부모님의 오늘 일상이 궁금해요</p>
              </div>
            </button>
            <button
              onClick={() => handleSelectDirection('PARENT_TO_CHILD')}
              className="w-full min-h-[72px] rounded-2xl px-5 flex items-center gap-4 text-left [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: mA(0.07), border: `2px solid ${mA(0.15)}` }}
            >
              <span className="text-3xl" aria-hidden="true">🧑</span>
              <div>
                <p className="text-lg font-black text-foreground" style={{ wordBreak: 'keep-all' }}>자녀에게 초대 보내기</p>
                <p className="text-sm text-foreground/60 font-bold">자녀의 오늘 일상이 궁금해요</p>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: 문구 선택 */}
        {step === 'template' && (
          <div className="flex flex-col gap-2">
            <p className="text-base text-foreground/60 font-bold mb-2" style={{ wordBreak: 'keep-all' }}>
              {directionLabel} 어떤 공유를 초대할까요?
            </p>
            {PROMPT_TEMPLATES.map((t: PromptTemplateItem) => (
              <button
                key={t.code}
                onClick={() => handleSelectTemplate(t)}
                className="w-full min-h-[64px] rounded-2xl px-5 flex items-center gap-3 text-left [-webkit-tap-highlight-color:transparent] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: mA(0.07), border: `2px solid ${mA(0.15)}` }}
                onMouseEnter={e => { e.currentTarget.style.background = mA(0.13); e.currentTarget.style.borderColor = main }}
                onMouseLeave={e => { e.currentTarget.style.background = mA(0.07); e.currentTarget.style.borderColor = mA(0.15) }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-foreground" style={{ wordBreak: 'keep-all' }}>{t.label}</p>
                  <p className="text-sm text-foreground/50 font-bold">{t.description}</p>
                </div>
                <ChevronRight size={18} style={{ color: mA(0.4) }} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {/* Step 3: 발송 확인 */}
        {step === 'confirm' && selectedTemplate && (
          <div className="flex flex-col gap-5">
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: mA(0.07), border: `2px solid ${mA(0.18)}` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-black"
                  style={{ background: mA(0.15), color: dark }}
                >
                  {directionLabel}
                </span>
                {recipient && (
                  <span className="text-sm font-bold text-foreground/60">{recipient.nickname}님</span>
                )}
              </div>
              <p className="text-xl font-black text-foreground" style={serifStyle}>
                "{selectedTemplate.label}"
              </p>
            </div>

            {/* 가치 제안 문구 */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: `linear-gradient(135deg, ${mA(0.06)}, oklch(0.76 0.12 220 / 0.08))`,
                border: `1px solid ${mA(0.15)}`,
                wordBreak: 'keep-all',
              }}
            >
              <p className="text-sm font-bold text-foreground/70 leading-relaxed">
                💡 이게 쌓이면 1년 후 가족의 일상 앨범이 돼요.<br />
                오늘 한 장면을 함께 기록해 보세요.
              </p>
            </div>

            <button
              onClick={handleSend}
              disabled={sendPrompt.isPending}
              className="w-full min-h-[64px] rounded-2xl text-xl font-black text-white flex items-center justify-center gap-3 transition-opacity disabled:opacity-60 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: `linear-gradient(135deg, ${main}, oklch(0.76 0.12 220))`, boxShadow: `0 4px 20px ${mA(0.3)}` }}
            >
              {sendPrompt.isPending ? (
                <div className="w-6 h-6 rounded-full border-2 border-white/40 border-t-white animate-spin" role="status" aria-label="전송 중" />
              ) : (
                <>
                  <Send size={22} aria-hidden="true" />
                  공유 초대 보내기
                </>
              )}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
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
