import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useKakaoLogin } from '@/hooks/useAuth'

export default function KakaoCallbackPage() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const kakaoLogin = useKakaoLogin()

  useEffect(() => {
    if (!code) return
    const storageKey = `kakao_code_used_${code}`
    if (sessionStorage.getItem(storageKey)) return
    sessionStorage.setItem(storageKey, '1')
    kakaoLogin.mutate(code)
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  if (kakaoLogin.isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <p className="text-xl font-semibold text-destructive text-center">
          카카오 로그인 중 오류가 발생했어요.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>
        <Link
          to="/login"
          className="text-lg font-semibold underline underline-offset-4"
          style={{ color: 'oklch(0.48 0.15 220)' }}
        >
          로그인 페이지로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div
        className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: 'oklch(0.62 0.15 220)', borderTopColor: 'transparent' }}
        role="status"
        aria-label="로딩 중"
      />
      <p className="text-lg font-medium text-foreground/70">카카오 로그인 처리 중이에요...</p>
    </div>
  )
}
