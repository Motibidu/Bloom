import { type ReactNode } from 'react'
import Header from '@/components/layout/Header'

interface AuthLayoutProps {
  children: ReactNode
}

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

      <Header variant="auth" />

      {/* 콘텐츠 영역 */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 relative z-10">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </div>
  )
}
