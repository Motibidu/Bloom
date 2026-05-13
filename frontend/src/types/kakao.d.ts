// 카카오 JS SDK 최소 타입 선언
// 실제 SDK는 index.html의 <script src="https://developers.kakao.com/sdk/js/kakao.js">로 로드됨

declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void
      isInitialized: () => boolean
      Link: {
        sendDefault: (settings: {
          objectType: string
          content: {
            title: string
            description?: string
            imageUrl?: string
            link: {
              mobileWebUrl?: string
              webUrl?: string
            }
          }
          buttons?: Array<{
            title: string
            link: {
              mobileWebUrl?: string
              webUrl?: string
            }
          }>
        }) => void
      }
    }
  }
}

export {}
