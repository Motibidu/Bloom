import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ChevronLeft } from 'lucide-react'
import { useJoinFamily } from '@/hooks/useFamily'

// ── Warm Blue 테마 ─────────────────────────────────────────────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const serifStyle: React.CSSProperties = { fontFamily: "'Noto Serif KR', serif" }

export default function FamilyInvitePage() {
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const joinFamily = useJoinFamily()

  const handleJoin = async () => {
    const trimmed = inviteCode.trim().toUpperCase()
    if (!trimmed) {
      setError('초대 코드를 입력해 주세요')
      return
    }
    setError(null)
    try {
      await joinFamily.mutateAsync({ inviteCode: trimmed })
      navigate('/family', { replace: true })
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'ALREADY_IN_FAMILY') {
        setError('이미 가족 그룹의 멤버입니다.')
      } else {
        setError('올바른 초대 코드를 확인해 주세요.')
      }
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 pb-28 pt-4 flex flex-col gap-8">
      {/* 뒤로 가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 min-h-[48px] self-start text-base font-bold [-webkit-tap-highlight-color:transparent]"
        style={{ color: dark }}
        aria-label="뒤로 가기"
      >
        <ChevronLeft size={22} aria-hidden="true" />
        뒤로
      </button>

      {/* 아이콘 + 타이틀 */}
      <div className="text-center flex flex-col items-center gap-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${mA(0.12)}, ${mA(0.06)})`,
            border: `2px solid ${mA(0.2)}`,
          }}
          aria-hidden="true"
        >
          <UserPlus size={44} style={{ color: main }} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2" style={serifStyle}>
            가족 그룹 참여
          </h1>
          <p className="text-base text-foreground/60 font-bold leading-relaxed">
            가족에게 받은 초대 코드를<br />
            아래에 입력해 주세요
          </p>
        </div>
      </div>

      {/* 코드 입력 폼 */}
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="invite-code" className="block text-base font-bold text-foreground/80 mb-2">
            초대 코드
          </label>
          <input
            id="invite-code"
            type="text"
            value={inviteCode}
            onChange={e => {
              setInviteCode(e.target.value.toUpperCase())
              setError(null)
            }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="예: ABCD1234"
            className="w-full min-h-[60px] rounded-2xl px-5 text-2xl font-black tracking-[0.2em] border-2 bg-white focus:outline-none transition-colors uppercase text-center"
            style={{
              borderColor: inviteCode ? main : mA(0.25),
              color: dark,
            }}
            maxLength={12}
            autoCapitalize="characters"
            autoComplete="off"
            aria-describedby={error ? 'invite-error' : undefined}
          />
        </div>

        {error && (
          <p
            id="invite-error"
            className="text-base font-bold text-center"
            style={{ color: 'oklch(0.55 0.2 25)' }}
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={joinFamily.isPending || !inviteCode.trim()}
          className="min-h-[64px] w-full rounded-2xl text-xl font-black text-white transition-opacity disabled:opacity-50 [-webkit-tap-highlight-color:transparent]"
          style={{ background: grad, boxShadow: `0 4px 20px ${mA(0.3)}` }}
        >
          {joinFamily.isPending ? '참여 중...' : '가족 그룹 참여하기'}
        </button>

        <button
          onClick={() => navigate('/family')}
          className="min-h-[48px] w-full rounded-2xl text-base font-bold border-2 bg-white [-webkit-tap-highlight-color:transparent]"
          style={{ borderColor: mA(0.25), color: dark }}
        >
          취소
        </button>
      </div>
    </main>
  )
}
