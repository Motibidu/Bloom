import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Lock } from 'lucide-react'
import CheckInCard from '@/components/ui/domain/checkin/checkin-card'
import { useAuthStore } from '@/store/authStore'
import type { CheckIn } from '@/types'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }
const btnPrimary: React.CSSProperties = { background: grad, color: 'white', transition: 'opacity 0.2s, transform 0.15s' }

// 인증 인터셉터(api.ts)를 우회하기 위한 plain axios — 공개 조회는 401 자동 리다이렉트가 없어야 함
const publicApi = axios.create({ baseURL: '/api' })

export default function SharePreviewPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const checkinId = Number(id)
  const user = useAuthStore((s) => s.user)

  // 로그인 회원이 공유 링크로 진입하면 정식 상세 페이지로
  useEffect(() => {
    if (user) navigate(`/checkin/${checkinId}`, { replace: true })
  }, [user, checkinId, navigate])

  const { data: checkin, isLoading, isError } = useQuery<CheckIn>({
    queryKey: ['public-checkin', checkinId],
    queryFn: async () => {
      const res = await publicApi.get<CheckIn>(`/public/checkins/${checkinId}`)
      return res.data
    },
    enabled: !user && Number.isFinite(checkinId),
    retry: false,
  })

  // 로그인 사용자는 리다이렉트되므로 빈 화면
  if (user) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: mA(0.04) }}>
      {/* 미니 헤더 (로고) */}
      <header
        className="flex items-center gap-2 px-5 py-4 bg-white"
        style={{ borderBottom: `1px solid ${mA(0.10)}` }}
      >
        <span className="text-2xl" aria-hidden="true">🌸</span>
        <h1 className="text-lg font-black" style={{ ...serifStyle, color: dark }}>
          오늘 뭐 했어요?
        </h1>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 md:px-6 pt-5 pb-10">
        {/* 로딩 */}
        {isLoading && (
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
        )}

        {/* 에러 */}
        {isError && (
          <div role="alert" className="flex flex-col items-center gap-6 py-20 px-4 text-center">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: mA(0.10) }}
              aria-hidden="true"
            >
              <span className="text-5xl">😔</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground">활동을 찾을 수 없어요</p>
              <p className="text-lg font-medium text-muted-foreground leading-relaxed">
                삭제되었거나 잘못된 링크일 수 있어요
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/landing')}
              className="min-h-[56px] px-10 text-lg font-bold rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={btnPrimary}
            >
              서비스 둘러보기
            </button>
          </div>
        )}

        {/* 미리보기 */}
        {checkin && (
          <div className="space-y-6">
            <CheckInCard
              checkin={checkin}
              showFullContent
              canInteract={false}
              showMenu={false}
            />

            {/* 잠금 + 가입 유도 영역 */}
            <div
              className="rounded-2xl px-6 py-7 text-center space-y-5"
              style={{
                background: `linear-gradient(135deg, ${mA(0.08)}, ${lA(0.12)})`,
                border: `1px solid ${mA(0.18)}`,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Lock size={18} style={{ color: dark }} aria-hidden="true" />
                <p className="text-base font-bold" style={{ color: dark }}>
                  댓글과 반응은 로그인 후에 확인할 수 있어요
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full min-h-[56px] text-xl font-black rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={btnPrimary}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                나도 시작하기
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center min-h-[44px] text-base font-bold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg px-3"
                style={{ color: dark }}
              >
                이미 회원이세요? 로그인
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              중장년층을 위한 일상 기록 서비스 · 오늘 뭐 했어요?
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
