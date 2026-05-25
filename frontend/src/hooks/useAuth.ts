import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { isNativeApp, flushPendingFcmToken } from '@/lib/native-bridge'
import { registerFcmWeb } from '@/lib/push-notification'
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth'

export function useLogin() {
  const { setAccessToken, setUser } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
    onSuccess: async (data) => {
      setAccessToken(data.accessToken)
      const userRes = await api.get('/users/me')
      setUser(userRes.data)
      if (isNativeApp()) {
        flushPendingFcmToken()
      } else {
        registerFcmWeb()
      }
      navigate('/')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      api.post('/auth/register', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('회원가입이 완료되었어요! 로그인해 주세요.')
      navigate('/login')
    },
  })
}

export function useKakaoLogin() {
  const { setAccessToken, setUser } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (code: string) =>
      api.post<AuthResponse>('/auth/kakao', { code }).then((r) => r.data),
    onSuccess: async (data) => {
      setAccessToken(data.accessToken)
      const userRes = await api.get('/users/me')
      setUser(userRes.data)
      if (data.needsNicknameSetup) {
        navigate('/kakao-onboarding')
      } else {
        if (isNativeApp()) {
          flushPendingFcmToken()
        } else {
          registerFcmWeb()
        }
        navigate('/')
      }
    },
  })
}

export function useSetKakaoNickname() {
  const { setUser } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { nickname: string; birthYear: number }) =>
      api.patch('/auth/kakao/nickname', data).then((r) => r.data),
    onSuccess: async () => {
      const userRes = await api.get('/users/me')
      setUser(userRes.data)
      if (isNativeApp()) {
        flushPendingFcmToken()
      } else {
        registerFcmWeb()
      }
      navigate('/')
    },
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      queryClient.clear()
      logout()
      navigate('/login')
    },
  })
}
