import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { isNativeApp, registerPushToken } from '@/lib/native-bridge'
import { registerFcmWeb } from '@/lib/push-notification'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import LandingPage from '@/pages/LandingPage'
import FeedPage from '@/pages/FeedPage'
import ActivityDetailPage from '@/pages/ActivityDetailPage'
import MyActivityPage from '@/pages/MyActivityPage'
import MonthlyReportPage from '@/pages/MonthlyReportPage'
import FamilyPage from '@/pages/FamilyPage'
import FamilyInvitePage from '@/pages/FamilyInvitePage'
import DiscoverPage from '@/pages/DiscoverPage'
import NotFoundPage from '@/pages/NotFoundPage'
import KakaoCallbackPage from '@/pages/KakaoCallbackPage'
import KakaoOnboardingPage from '@/pages/KakaoOnboardingPage'

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
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    if (!user) {
      setReady(true)
      return
    }
    api.post<{ accessToken: string }>('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken)
        if (isNativeApp()) {
          registerPushToken()
        } else {
          registerFcmWeb()
        }
      })
      .catch(() => {
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
          <Route path="/kakao-callback" element={<KakaoCallbackPage />} />

          {/* 로그인 필요 라우트 — Layout(Header) 포함 */}
          <Route
            path="/"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<FeedPage />} />
            <Route path="checkin/:id" element={<ActivityDetailPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="family/invite" element={<FamilyInvitePage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="me" element={<MyActivityPage />} />
            <Route path="me/report" element={<MonthlyReportPage />} />
            <Route path="kakao-onboarding" element={<KakaoOnboardingPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
