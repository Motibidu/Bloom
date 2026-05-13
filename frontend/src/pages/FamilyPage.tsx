import { useState } from 'react'
import { Users, Copy, Check, UserPlus, Home, ChevronRight, X } from 'lucide-react'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import { useMyFamily, useCreateFamily, useJoinFamily, useFamilyFeed } from '@/hooks/useFamily'
import { useNavigate } from 'react-router-dom'

// ── Warm Blue 테마 ─────────────────────────────────────────────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

const serifStyle: React.CSSProperties = { fontFamily: "'Noto Serif KR', serif" }

// ── 초대 코드 복사 버튼 ────────────────────────────────────────────────────────
function InviteCodeBlock({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="rounded-2xl p-4 flex items-center justify-between gap-3"
      style={{
        background: mA(0.06),
        border: `1.5px solid ${mA(0.15)}`,
      }}
    >
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
        onClick={handleCopy}
        className="flex items-center gap-2 min-h-[48px] px-4 rounded-xl font-bold text-base transition-all duration-200 [-webkit-tap-highlight-color:transparent]"
        style={copied
          ? { background: 'oklch(0.65 0.12 150)', color: 'white' }
          : { background: grad, color: 'white' }
        }
        aria-label={copied ? '복사됨' : '초대 코드 복사'}
      >
        {copied ? (
          <>
            <Check size={18} aria-hidden="true" />
            복사됨
          </>
        ) : (
          <>
            <Copy size={18} aria-hidden="true" />
            복사
          </>
        )}
      </button>
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

  if (!feed || feed.length === 0) {
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
      {feed.map(checkin => (
        <CheckInCard
          key={checkin.id}
          checkin={checkin}
          onClick={() => navigate(`/checkin/${checkin.id}`)}
        />
      ))}
    </div>
  )
}

// ── 그룹 있는 화면 ─────────────────────────────────────────────────────────────
function FamilyGroupView({ groupId, name, inviteCode, members }: {
  groupId: number
  name: string
  inviteCode: string
  members: { userId: number; nickname: string; profileImageUrl: string | null }[]
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* 그룹 헤더 카드 */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: grad,
          boxShadow: `0 8px 32px ${mA(0.25)}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Home size={18} className="text-white/80" aria-hidden="true" />
          <span className="text-white/80 text-sm font-bold">우리 가족</span>
        </div>
        <h1
          className="text-3xl font-black text-white mb-4 leading-tight"
          style={serifStyle}
        >
          {name}
        </h1>

        {/* 멤버 아바타 목록 */}
        <div
          className="rounded-2xl p-4 flex gap-5 overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          {members.map(m => (
            <div key={m.userId} className="flex flex-col items-center gap-2 shrink-0">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.35)',
                  color: dark,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
                aria-hidden="true"
              >
                {m.profileImageUrl ? (
                  <img
                    src={m.profileImageUrl}
                    alt={m.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  m.nickname[0]
                )}
              </div>
              <span className="text-white text-sm font-bold max-w-[60px] text-center truncate">
                {m.nickname}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 초대 코드 */}
      <InviteCodeBlock inviteCode={inviteCode} />

      {/* 가족 피드 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-1.5 h-6 rounded-full"
            style={{ background: grad }}
            aria-hidden="true"
          />
          <h2 className="text-xl font-black text-foreground" style={serifStyle}>
            가족 활동
          </h2>
        </div>
        <FamilyFeed groupId={groupId} />
      </div>
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

  return (
    <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
      {family ? (
        <FamilyGroupView
          groupId={family.groupId}
          name={family.name}
          inviteCode={family.inviteCode}
          members={family.members}
        />
      ) : is404 || isError ? (
        <FamilyEmpty />
      ) : null}
    </main>
  )
}
