import { LogOut, UserRound, Smile } from 'lucide-react'
import NotificationBell from '@/components/layout/NotificationBell'
import { Link, useNavigate } from 'react-router-dom'
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

const grad = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'
const dark = 'oklch(0.48 0.15 220)'

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

export default function Header({ variant = 'internal' }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()

  const isLanding = variant === 'landing'
  const isAuth = variant === 'auth'

  return (
    <header
      className={[
        'h-16 sm:h-20 border-b border-gray-100 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0',
        isLanding ? 'sticky top-0 z-50' : 'relative z-10',
      ].join(' ')}
    >
      <Logo to={isLanding ? '/landing' : isAuth ? '/landing' : '/'} />

      {/* landing: 로그인 / 회원가입 버튼 */}
      {isLanding && (
        <nav aria-label="주요 메뉴" className="flex items-center gap-2 shrink-0">
          <Link to="/login">
            <button
              className="min-h-[44px] px-3 sm:px-5 text-sm sm:text-base font-bold rounded-xl whitespace-nowrap
                         text-foreground/70 hover:text-foreground transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              로그인
            </button>
          </Link>
          <Link to="/register">
            <button
              className="min-h-[44px] px-3 sm:px-5 text-sm sm:text-base font-bold rounded-xl whitespace-nowrap text-white
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: grad }}
            >
              회원가입
            </button>
          </Link>
        </nav>
      )}

      {/* internal: 네비 링크 + 알림 + 프로필 */}
      {!isLanding && !isAuth && (
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hidden md:block text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            피드
          </Link>
          <Link
            to="/family"
            className="hidden md:block text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            가족
          </Link>
          <Link
            to="/discover"
            className="hidden md:block text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            찾기
          </Link>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="프로필 메뉴"
              >
                <Avatar
                  className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ boxShadow: '0 2px 8px oklch(0.62 0.15 220 / 0.25)' }}
                >
                  {user?.profileImageUrl && (
                    <AvatarImage src={user.profileImageUrl} alt={`${user.nickname} 프로필`} className="object-cover" />
                  )}
                  <AvatarFallback
                    className="text-base font-semibold text-white"
                    style={{ background: grad }}
                  >
                    {user?.nickname ? user.nickname.slice(0, 2) : <UserRound size={22} aria-hidden="true" />}
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
