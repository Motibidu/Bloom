import api from './api'

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
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
    await api.post('/push-tokens', { token }).catch(() => {
      console.warn('[native-bridge] push-tokens 엔드포인트 미구현 — 토큰 등록 건너뜀')
    })
  } catch (e) {
    console.warn('[native-bridge] FCM 토큰 요청 실패:', e)
  }
}

if (isNativeApp()) {
  initListener()
}
