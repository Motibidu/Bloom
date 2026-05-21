import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldOff, ShieldCheck } from 'lucide-react'
import { useBlockedUsers, useUnblockUser } from '@/hooks/useBlock'

const main = 'oklch(0.62 0.15 220)'
const dark = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

export default function BlockListPage() {
  const navigate = useNavigate()
  const { data: blockedUsers = [], isLoading } = useBlockedUsers()
  const unblock = useUnblockUser()
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  const handleUnblock = (userId: number) => {
    unblock.mutate(userId, {
      onSuccess: () => setConfirmingId(null),
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: mA(0.08), color: dark }}
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-black text-foreground">차단 목록</h1>
      </div>

      {/* 안내 문구 */}
      <p className="text-base text-foreground/60 leading-relaxed px-1">
        차단한 사용자의 활동은 피드에 표시되지 않아요.
      </p>

      {/* 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${main} transparent transparent transparent` }}
            aria-label="불러오는 중"
          />
        </div>
      ) : blockedUsers.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 py-20 rounded-2xl text-center"
          style={{ background: mA(0.04), border: `1px dashed ${mA(0.20)}` }}
        >
          <ShieldCheck size={48} style={{ color: mA(0.40) }} aria-hidden="true" />
          <p className="text-lg font-bold text-foreground/60">차단한 사용자가 없어요</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {blockedUsers.map((user) => (
            <li
              key={user.userId}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white"
              style={{ boxShadow: `0 2px 12px ${mA(0.08)}`, border: `1px solid ${mA(0.10)}` }}
            >
              {/* 아바타 */}
              <div
                className="w-12 h-12 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-black text-lg text-white"
                style={user.profileImageUrl
                  ? {}
                  : { background: `linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))` }
                }
              >
                {user.profileImageUrl
                  ? <img src={user.profileImageUrl} alt={`${user.nickname} 프로필`} className="w-full h-full object-cover" />
                  : <span aria-hidden="true">{user.nickname[0]}</span>
                }
              </div>

              {/* 닉네임 */}
              <p className="flex-1 text-base font-bold text-foreground truncate">{user.nickname}</p>

              {/* 차단 해제 버튼 */}
              {confirmingId === user.userId ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="h-10 px-4 rounded-xl text-sm font-bold transition-colors"
                    style={{ background: mA(0.08), color: dark }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnblock(user.userId)}
                    disabled={unblock.isPending}
                    className="h-10 px-4 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                    style={{ background: 'oklch(0.55 0.18 20)' }}
                  >
                    {unblock.isPending ? '해제 중...' : '해제'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(user.userId)}
                  className="shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: mA(0.08), color: dark, border: `1px solid ${mA(0.18)}` }}
                  aria-label={`${user.nickname} 차단 해제`}
                >
                  <ShieldOff size={15} aria-hidden="true" />
                  차단 해제
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
