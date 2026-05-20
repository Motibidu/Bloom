import api from './api'

const PENDING_TOKEN_KEY = 'pending_fcm_token'

async function savePushToken(token: string): Promise<void> {
  console.log('[native-bridge] savePushToken 시도')
  await api.post('/push-tokens', { token })
    .then(() => {
      console.log('[native-bridge] FCM 토큰 즉시 저장 성공')
      localStorage.removeItem(PENDING_TOKEN_KEY)
    })
    .catch((e) => {
      console.warn('[native-bridge] 즉시 저장 실패, 로컬 임시저장:', e?.response?.status)
      localStorage.setItem(PENDING_TOKEN_KEY, token)
    })
}

export async function flushPendingFcmToken(): Promise<void> {
  const token = localStorage.getItem(PENDING_TOKEN_KEY)
  console.log('[native-bridge] flushPendingFcmToken 호출, token:', token ? token.slice(0, 20) + '...' : 'null')
  if (!token) return
  await api.post('/push-tokens', { token })
    .then(() => {
      console.log('[native-bridge] FCM 토큰 서버 저장 성공')
      localStorage.removeItem(PENDING_TOKEN_KEY)
    })
    .catch((e) => console.warn('[native-bridge] FCM 토큰 재시도 실패:', e))
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
    __nativeFcmToken?: string
  }
}

export interface BridgeContact {
  name?: string
  phone?: string
}

type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
}

const pending = new Map<string, PendingRequest>()

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function initListener(): void {
  window.addEventListener('message', (e: MessageEvent) => {
    try {
      const msg = JSON.parse(e.data as string)

      // 앱 자동 발급 토큰 — pending 없이 바로 저장
      if (msg.type === 'PUSH_TOKEN_RESULT' && msg.requestId === 'auto') {
        savePushToken(msg.payload as string)
        return
      }

      const p = pending.get(msg.requestId)
      if (!p) return
      if (msg.type === 'BRIDGE_ERROR') {
        p.reject(new Error(msg.error as string))
      } else {
        p.resolve(msg.payload)
      }
      pending.delete(msg.requestId)
    } catch {
      // 파싱 실패 무시
    }
  })
}

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && window.ReactNativeWebView !== undefined
}

function postBridgeMessage(type: string, requestId: string): void {
  window.ReactNativeWebView!.postMessage(JSON.stringify({ type, requestId }))
}

export function requestContacts(): Promise<BridgeContact[]> {
  if (!isNativeApp()) return Promise.resolve([])
  const requestId = generateId()
  return new Promise<BridgeContact[]>((resolve, reject) => {
    pending.set(requestId, {
      resolve: (v) => resolve(v as BridgeContact[]),
      reject,
    })
    postBridgeMessage('REQUEST_CONTACTS', requestId)
  })
}

export function requestCamera(): Promise<string | null> {
  if (!isNativeApp()) return Promise.resolve(null)
  const requestId = generateId()
  return new Promise<string | null>((resolve, reject) => {
    pending.set(requestId, {
      resolve: (v) => resolve(v as string),
      reject,
    })
    postBridgeMessage('REQUEST_CAMERA', requestId)
  })
}

export async function registerPushToken(): Promise<void> {
  if (!isNativeApp()) return
  const requestId = generateId()
  try {
    const token = await new Promise<string>((resolve, reject) => {
      pending.set(requestId, {
        resolve: (v) => resolve(v as string),
        reject,
      })
      postBridgeMessage('REQUEST_PUSH_TOKEN', requestId)
    })
    await savePushToken(token)
  } catch (e) {
    console.warn('[native-bridge] FCM 토큰 요청 실패:', e)
  }
}

if (isNativeApp()) {
  initListener()

  // 앱이 주입한 FCM 토큰 수신
  window.addEventListener('native-fcm-token', (e: Event) => {
    const token = (e as CustomEvent<string>).detail
    console.log('[native-bridge] native-fcm-token 이벤트 수신:', token.slice(0, 20) + '...')
    savePushToken(token)
  })

  // 이미 주입된 토큰이 있으면 즉시 처리 (페이지 이동 후 재마운트 케이스)
  if (window.__nativeFcmToken) {
    savePushToken(window.__nativeFcmToken)
  }
}
