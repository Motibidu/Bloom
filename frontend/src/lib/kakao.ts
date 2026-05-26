const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined

export function ensureKakaoInit(): boolean {
  if (typeof window === 'undefined' || !window.Kakao || !JS_KEY) return false
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(JS_KEY)
  }
  return window.Kakao.isInitialized()
}

export function isKakaoShareReady(): boolean {
  return ensureKakaoInit() && !!window.Kakao?.Share
}
