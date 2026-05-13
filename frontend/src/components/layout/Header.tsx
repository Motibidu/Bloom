import { LogOut, UserRound, Smile } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
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

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <header className="h-20 border-b border-border bg-white/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      {/* 왼쪽: 로고 */}
      <Link to="/" className="flex items-center gap-3">
        {/* 로고 아이콘 박스 */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: warmBlueGradient }}
          aria-hidden="true"
        >
          <Smile size={22} className="text-white" aria-hidden="true" />
        </div>
        {/* 브랜드 이름 — 그라디언트 텍스트 */}
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

      {/* 오른쪽: PC - 피드 링크 + 프로필 드롭다운 */}
      <div className="flex items-center gap-4">
        {/* PC에서만 노출되는 네비게이션 링크 */}
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

        {/* 프로필 아바타 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="프로필 메뉴"
            >
              <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarFallback
                  className="text-base font-semibold text-white"
                  style={{ background: warmBlueGradient }}
                >
                  {user?.nickname
                    ? user.nickname.slice(0, 2)
                    : <UserRound size={22} aria-hidden="true" />
                  }
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
            <DropdownMenuItem
              onClick={() => navigate('/family')}
              className="cursor-pointer"
            >
              가족 그룹
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/me')}
              className="cursor-pointer"
            >
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
    </header>
  )
}
