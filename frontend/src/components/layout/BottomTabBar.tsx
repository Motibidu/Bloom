import { ImageIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function BottomTabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isActive = pathname === '/'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background border-t border-border flex items-center justify-around">
      <button
        onClick={() => navigate('/')}
        aria-label="오늘의 피드 보기"
        aria-current={isActive ? 'page' : undefined}
        className={`flex flex-col items-center justify-center gap-1.5 min-h-[64px] min-w-[72px] px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isActive ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        <ImageIcon size={28} aria-hidden="true" />
        <span className="text-base font-semibold">피드</span>
      </button>
    </nav>
  )
}
