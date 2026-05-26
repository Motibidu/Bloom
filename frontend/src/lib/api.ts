import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// AuthInitializer가 앱 초기화 시 사용하는 단일 refresh 함수
// 인터셉터와 동일한 isRefreshing 플래그를 공유하여 중복 호출 방지
// React StrictMode의 이중 마운트에도 단 한 번만 실행됨
export function initRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise

  isRefreshing = true
  refreshPromise = api.post<{ accessToken: string }>('/auth/refresh')
    .then(({ data }) => {
      const token = data.accessToken
      useAuthStore.getState().setAccessToken(token)
      processQueue(null, token)
      return token
    })
    .catch((err) => {
      processQueue(err, null)
      throw err
    })
    .finally(() => {
      isRefreshing = false
      // promise를 즉시 null로 초기화하지 않고 1초 유지
      // StrictMode 이중 마운트 간격 내 두 번째 호출이 같은 promise를 재사용하도록
      setTimeout(() => { refreshPromise = null }, 1000)
    })

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    const url = originalRequest.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // 이미 refresh 진행 중(AuthInitializer 또는 다른 인터셉터) → 완료 후 재시도
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true

      try {
        const newToken = await initRefresh()
        originalRequest.headers!.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
