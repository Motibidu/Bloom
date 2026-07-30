import { LogOut, UserRound, Smile, NotebookText, Camera } from 'lucide-react'
import NotificationBell from '@/components/layout/NotificationBell'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcn/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'

const main = 'oklch(0.62 0.15 220)'
const dark = 'oklch(0.48 0.15 220)'
const grad = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

type HeaderVariant = 'internal' | 'landing' | 'auth'

interface HeaderProps {
  variant?: HeaderVariant
}

function Logo({ to }: { to: string }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <div
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: grad }}
        aria-hidden="true"
      >
        <Smile size={18} className="text-white" aria-hidden="true" />
      </div>
      <span
        className="text-base sm:text-xl font-black tracking-tight whitespace-nowrap"
        style={{
          fontFamily: "'Noto Serif KR', serif",
          backgroundImage: grad,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        오늘 뭐 했어요?
      </span>
    </Link>
  )
}

const NAV_ITEMS = [
  { to: '/photos', label: '사진',     icon: Camera,       exact: false },
  { to: '/board',  label: '게시판',   icon: NotebookText, exact: false },
  { to: '/me',     label: '나의 활동', icon: UserRound,    exact: false },
] as const

export default function Header({ variant = 'internal' }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isLanding = variant === 'landing'
  const isAuth = variant === 'auth'

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname.startsWith(to)

  return (
    <header
      className={[
        'h-16 sm:h-20 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 relative',
        isLanding ? 'sticky top-0 z-50' : 'relative z-10',
      ].join(' ')}
      style={{
        borderBottom: `1px solid ${mA(0.10)}`,
        boxShadow: `0 2px 20px ${mA(0.07)}`,
      }}
    >
      {/* 하단 gradient border — internal 헤더에만 적용 */}
      {!isLanding && !isAuth && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2.5px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${main} 20%, oklch(0.76 0.12 220) 60%, transparent)`,
          }}
          aria-hidden="true"
        />
      )}

      <Logo to={isLanding ? '/landing' : isAuth ? '/landing' : '/'} />

      {/* landing: 로그인 / 회원가입 버튼 */}
      {isLanding && (
        <nav aria-label="주요 메뉴" className="flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            className="min-h-[44px] px-3 sm:px-5 text-sm sm:text-base font-bold rounded-xl whitespace-nowrap
                       text-foreground/70 hover:text-foreground transition-colors inline-flex items-center
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            로그인
          </Link>
          <Link
            to="/register"
            className="min-h-[44px] px-3 sm:px-5 text-sm sm:text-base font-bold rounded-xl whitespace-nowrap inline-flex items-center border-2
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: main, color: dark }}
          >
            회원가입
          </Link>
        </nav>
      )}

      {/* internal: 네비 링크 + 알림 + 프로필 */}
      {!isLanding && !isAuth && (
        <div className="flex items-center gap-2">
          {/* 데스크탑 네비 — 아이콘 + 텍스트 세로 스택 */}
          <nav aria-label="주요 메뉴" className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
              const active = isActive(to, exact)
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl min-w-[60px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: active ? mA(0.09) : 'transparent',
                    color: active ? dark : mA(0.5),
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = mA(0.06) }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Icon
                    size={18}
                    aria-hidden="true"
                    style={{ color: active ? main : mA(0.45) }}
                  />
                  <span className="text-xs font-bold leading-none">{label}</span>
                </Link>
              )
            })}
          </nav>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="프로필 메뉴"
              >
                <Avatar
                  className="w-10 h-10 sm:w-11 sm:h-11 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ boxShadow: `0 2px 8px ${mA(0.25)}` }}
                >
                  {user?.profileImageUrl && (
                    <AvatarImage src={user.profileImageUrl} alt={`${user.nickname} 프로필`} className="object-cover" />
                  )}
                  <AvatarFallback
                    className="text-sm font-black text-white"
                    style={{ background: grad }}
                  >
                    {user?.nickname ? user.nickname.slice(0, 2) : <UserRound size={20} aria-hidden="true" />}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user && (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <p className="font-semibold text-foreground">{user.nickname}</p>
                    <p className="text-sm font-medium text-foreground/60 mt-0.5">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => navigate('/family')} className="cursor-pointer">
                가족 그룹
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/board')} className="cursor-pointer">
                게시판
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/discover')} className="cursor-pointer">
                사람 찾기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/me')} className="cursor-pointer">
                나의 활동
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut size={20} aria-hidden="true" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  )
}
