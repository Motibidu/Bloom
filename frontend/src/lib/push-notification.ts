import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import api from './api'
import { queryClient } from './queryClient'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

// 사용자 클릭 등 명시적 제스처 컨텍스트에서만 호출해야 함
export async function requestFcmPermissionAndRegister(): Promise<void> {
  if (!('serviceWorker' in navigator) || !VAPID_KEY) return
  const permission = await Notification.requestPermission()
  if (permission === 'granted') await registerFcmWeb()
}

export async function registerFcmWeb(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  if (!VAPID_KEY) {
    console.warn('[fcm] VITE_FIREBASE_VAPID_KEY 미설정 — FCM 비활성화')
    return
  }

  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    const messaging = getMessaging(app)

    // 이미 허용된 경우에만 토큰 등록 — requestPermission()을 여기서 호출하면
    // 앱 초기화 시 보류됐다가 다음 사용자 클릭(카카오 공유 버튼 등)에 편승해 팝업이 뜸
    if (Notification.permission !== 'granted') return

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })

    if (!token) return

    console.log('[fcm] FCM 토큰:', token)
    await api.post('/push-tokens', { token })

    // 포그라운드 수신 시 알림 캐시 갱신 (시스템 알림바 표시 억제)
    onMessage(messaging, () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })
  } catch (e) {
    console.warn('[fcm] FCM 토큰 등록 실패:', e)
  }
}
