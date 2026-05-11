import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Smile } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      style={{ backgroundColor: 'oklch(0.98 0.015 220)' }}
    >
      {/* 장식 orb — 우측 상단 */}
      <div
        className="lp-orb-pulse pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full"
        style={{ background: 'oklch(0.62 0.15 220 / 0.08)' }}
        aria-hidden="true"
      />
      {/* 장식 orb — 좌측 하단 */}
      <div
        className="lp-orb-pulse pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full"
        style={{ background: 'oklch(0.76 0.12 220 / 0.1)' }}
        aria-hidden="true"
      />

      {/* 헤더 */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border flex items-center px-6 shrink-0 relative z-10">
        <Link to="/landing" className="flex items-center gap-3">
          {/* 로고 아이콘 박스 */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: warmBlueGradient }}
            aria-hidden="true"
          >
            <Smile size={22} className="text-white" aria-hidden="true" />
          </div>
          {/* 브랜드 이름 */}
          <span
            className="text-xl font-extrabold"
            style={{
              fontFamily: "'Noto Serif KR', serif",
              backgroundImage: warmBlueGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            오늘 뭐 했어요?
          </span>
        </Link>
      </header>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 relative z-10">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </div>
  )
}
