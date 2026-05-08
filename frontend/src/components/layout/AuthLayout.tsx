import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/60">
      <header className="h-16 border-b border-border bg-card flex items-center px-4 shrink-0">
        <Link to="/landing" className="flex items-center">
          <span className="text-xl font-extrabold text-primary tracking-tight">
            오늘 뭐 했어요?
          </span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </div>
  )
}
