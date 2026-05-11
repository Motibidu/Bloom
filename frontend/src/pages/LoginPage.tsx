import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import AuthLayout from '@/components/layout/AuthLayout'
import { useLogin } from '@/hooks/useAuth'
import type { LoginRequest } from '@/types/auth'

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'
const warmBlueDark = 'oklch(0.48 0.15 220)' as const

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>()
  const login = useLogin()

  const onSubmit = (data: LoginRequest) => {
    login.mutate(data)
  }

  const getErrorMessage = () => {
    if (!login.error) return null
    const axiosError = login.error as AxiosError<{ message: string }>
    return axiosError.response?.data?.message ?? '로그인에 실패했어요. 다시 시도해 주세요.'
  }

  return (
    <AuthLayout>
      {/* 폼 컨테이너 */}
      <div
        className="w-full rounded-3xl bg-white px-8 py-10"
        style={{ boxShadow: '0 8px 40px oklch(0.62 0.15 220 / 0.12)' }}
      >
        {/* 브랜드 헤더 */}
        <div className="text-center mb-8 space-y-2">
          <h1
            className="text-3xl font-black text-foreground"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            반가워요!
          </h1>
          <p className="text-lg text-foreground/70 font-medium leading-relaxed">
            오늘 하루도 수고하셨어요.
            <br />
            계속하려면 로그인해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-lg font-semibold text-foreground">
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              className="h-14 text-lg px-4 rounded-xl border-2"
              placeholder="예: hong@naver.com"
              {...register('email', {
                required: '이메일을 입력하세요',
                pattern: { value: /\S+@\S+\.\S+/, message: '올바른 이메일 형식이 아닙니다' },
              })}
            />
            {errors.email && (
              <p className="text-base text-destructive font-medium" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-lg font-semibold text-foreground">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              className="h-14 text-lg px-4 rounded-xl border-2"
              placeholder="비밀번호를 입력해 주세요"
              {...register('password', { required: '비밀번호를 입력하세요' })}
            />
            {errors.password && (
              <p className="text-base text-destructive font-medium" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* API 오류 메시지 */}
          {login.isError && (
            <p
              className="text-base text-destructive font-medium text-center"
              role="alert"
              aria-live="assertive"
            >
              {getErrorMessage()}
            </p>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full h-16 text-xl font-black rounded-2xl text-white mt-2
                       transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{
              background: login.isPending ? 'oklch(0.76 0.12 220)' : warmBlueGradient,
            }}
            aria-busy={login.isPending}
            aria-label={login.isPending ? '로그인하는 중이에요' : '로그인하기'}
          >
            {login.isPending ? '로그인하는 중이에요...' : '로그인하기'}
          </button>

          {/* 회원가입 안내 */}
          <p className="text-base text-center text-muted-foreground pt-2">
            계정이 없으신가요?{' '}
            <Link
              to="/register"
              className="underline underline-offset-4 font-semibold"
              style={{ color: warmBlueDark }}
            >
              회원가입하기
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
