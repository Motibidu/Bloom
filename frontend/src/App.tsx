import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import LandingPage from '@/pages/LandingPage'
import FeedPage from '@/pages/FeedPage'
import ActivityDetailPage from '@/pages/ActivityDetailPage'
import MyActivityPage from '@/pages/MyActivityPage'
import NotFoundPage from '@/pages/NotFoundPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  return isAuthenticated ? <>{children}</> : <Navigate to="/landing" replace />
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

// 앱 초기 진입 시 refresh token 쿠키로 accessToken 복구
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { user, setAccessToken, logout } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // user가 localStorage에 없으면 세션 없음 — refresh 불필요
    if (!user) {
      setReady(true)
      return
    }
    api.post<{ accessToken: string }>('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken)
      })
      .catch(() => {
        // refresh token 만료 — 완전 로그아웃
        logout()
      })
      .finally(() => setReady(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
        <Routes>
          {/* 비로그인 전용 라우트 */}
          <Route path="/landing" element={<LandingPage />} />
          <Route
            path="/login"
            element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>}
          />
          <Route
            path="/register"
            element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>}
          />

          {/* 로그인 필요 라우트 — Layout(Header) 포함 */}
          <Route
            path="/"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<FeedPage />} />
            <Route path="checkin/:id" element={<ActivityDetailPage />} />
            <Route path="me" element={<MyActivityPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
