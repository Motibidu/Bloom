// 카카오 JS SDK 최소 타입 선언
// 실제 SDK는 index.html의 <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js">로 로드됨

interface KakaoLink {
  mobileWebUrl?: string
  webUrl?: string
}

declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void
      isInitialized: () => boolean
      Share: {
        sendDefault: (settings: {
          objectType: string
          content: {
            title: string
            description?: string
            imageUrl?: string
            link: KakaoLink
          }
          buttons?: Array<{
            title: string
            link: KakaoLink
          }>
        }) => void
        createDefaultButton: (settings: {
          container: string | HTMLElement
          objectType: string
          content: {
            title: string
            description?: string
            imageUrl?: string
            link: KakaoLink
          }
          buttons?: Array<{
            title: string
            link: KakaoLink
          }>
        }) => void
      }
    }
  }
}

export {}
