import { LogOut, UserRound } from 'lucide-react'
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

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* 왼쪽: 로고 */}
      <Link to="/" className="flex items-center">
        <span className="text-xl font-extrabold text-primary tracking-tight">
          오늘 뭐 했어요?
        </span>
      </Link>

      {/* 오른쪽: PC - 피드 링크 + 프로필 드롭다운 */}
      <div className="flex items-center gap-3">
        {/* PC에서만 노출되는 피드 바로가기 링크 */}
        <Link
          to="/"
          className="hidden md:block text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          피드
        </Link>

        {/* 프로필 아바타 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="프로필 메뉴"
            >
              <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
                  {user?.nickname
                    ? user.nickname.slice(0, 2)
                    : <UserRound size={22} />
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
              <LogOut size={20} />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
