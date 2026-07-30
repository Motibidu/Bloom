import { LayoutList, Users, UserCircle2, Camera } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'

interface TabItem {
  path: string
  label: string
  icon: React.ReactNode
  iconActive: React.ReactNode
  matchPrefix?: boolean
  ariaLabel: string
}

export default function BottomTabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const tabs: TabItem[] = [
    {
      path: '/',
      label: '피드',
      ariaLabel: '오늘의 피드 보기',
      icon: <LayoutList size={26} className="text-muted-foreground" aria-hidden="true" />,
      iconActive: <LayoutList size={26} className="text-white" aria-hidden="true" />,
    },
    {
      path: '/family',
      label: '가족',
      ariaLabel: '가족 그룹 보기',
      matchPrefix: true,
      icon: <Users size={26} className="text-muted-foreground" aria-hidden="true" />,
      iconActive: <Users size={26} className="text-white" aria-hidden="true" />,
    },
    {
      path: '/photos',
      label: '사진',
      ariaLabel: '사진 모아보기',
      matchPrefix: true,
      icon: <Camera size={26} className="text-muted-foreground" aria-hidden="true" />,
      iconActive: <Camera size={26} className="text-white" aria-hidden="true" />,
    },
    {
      path: '/me',
      label: '나의 활동',
      ariaLabel: '나의 활동 보기',
      matchPrefix: true,
      icon: <UserCircle2 size={26} className="text-muted-foreground" aria-hidden="true" />,
      iconActive: <UserCircle2 size={26} className="text-white" aria-hidden="true" />,
    },
  ]

  const isTabActive = (tab: TabItem) => {
    if (tab.matchPrefix) return pathname.startsWith(tab.path)
    return pathname === tab.path
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/90 backdrop-blur-md border-t border-border flex items-center justify-around px-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(tab => {
        const active = isTabActive(tab)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            aria-label={tab.ariaLabel}
            aria-current={active ? 'page' : undefined}
            className="flex items-center justify-center min-h-[64px] min-w-[72px] px-1
                       transition-colors focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl
                       [-webkit-tap-highlight-color:transparent]"
          >
            {active ? (
              <div
                className="flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-2xl"
                style={{ background: warmBlueGradient }}
              >
                {tab.iconActive}
                <span className="text-sm font-bold text-white">{tab.label}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-2.5">
                {tab.icon}
                <span className="text-sm font-bold text-muted-foreground">{tab.label}</span>
              </div>
            )}
          </button>
        )
      })}
    </nav>
  )
}
