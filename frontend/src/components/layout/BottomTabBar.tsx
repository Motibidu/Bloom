import { LayoutList } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'

export default function BottomTabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isActive = pathname === '/'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/90 backdrop-blur-md border-t border-border flex items-center justify-around px-4">
      <button
        onClick={() => navigate('/')}
        aria-label="오늘의 피드 보기"
        aria-current={isActive ? 'page' : undefined}
        className="flex items-center justify-center min-h-[64px] min-w-[80px] px-2
                   transition-colors focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      >
        {isActive ? (
          /* 활성 탭 — warm blue 그라디언트 pill */
          <div
            className="flex flex-col items-center justify-center gap-1 px-6 py-2.5 rounded-2xl"
            style={{ background: warmBlueGradient }}
          >
            <LayoutList size={26} className="text-white" aria-hidden="true" />
            <span className="text-base font-bold text-white">피드</span>
          </div>
        ) : (
          /* 비활성 탭 */
          <div className="flex flex-col items-center justify-center gap-1 px-6 py-2.5">
            <LayoutList size={26} className="text-muted-foreground" aria-hidden="true" />
            <span className="text-base font-bold text-muted-foreground">피드</span>
          </div>
        )}
      </button>
    </nav>
  )
}
