import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useEffect, useRef, useState } from 'react'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import { initRefresh } from '@/lib/api'
import type { AxiosError } from 'axios'
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
import ProfileEditPage from '@/pages/ProfileEditPage'
import BlockListPage from '@/pages/BlockListPage'
import PrivacyPage from '@/pages/PrivacyPage'
import TermsPage from '@/pages/TermsPage'
import InviteLandingPage from '@/pages/InviteLandingPage'
import SharePreviewPage from '@/pages/SharePreviewPage'

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
  const { user, logout } = useAuthStore()
  const [ready, setReady] = useState(false)
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    if (!user) {
      setReady(true)
      return
    }
    initRefresh()
      .then(() => {
        if (!user.canWriteFeed) return  // FAMILY_VIEWER는 푸시 알림 불필요
        if (isNativeApp()) {
          registerPushToken()
        } else {
          registerFcmWeb()
        }
      })
      .catch((err: AxiosError) => {
        // 리프레시 토큰 만료(401)일 때만 로그아웃, 네트워크 오류 등은 유지
        if (err.response?.status === 401) {
          logout()
        }
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
          <Route path="/invite/:inviteCode" element={<InviteLandingPage />} />
          <Route path="/share/checkin/:id" element={<SharePreviewPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

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
            <Route path="me/edit" element={<ProfileEditPage />} />
            <Route path="me/blocks" element={<BlockListPage />} />
            <Route path="me/report" element={<MonthlyReportPage />} />
            <Route path="kakao-onboarding" element={<KakaoOnboardingPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </AuthInitializer>
      </BrowserRouter>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontSize: '1.0625rem',
            fontWeight: '600',
            padding: '16px 20px',
            minHeight: '56px',
            borderRadius: '16px',
          },
        }}
      />
    </QueryClientProvider>
  )
}
