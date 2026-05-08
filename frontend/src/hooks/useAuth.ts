import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
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
      // 회원가입 성공 후 로그인 페이지로 이동
      navigate('/login')
    },
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })
}
