import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import AuthLayout from '@/components/layout/AuthLayout'
import api from '@/lib/api'
import { useSetKakaoNickname } from '@/hooks/useAuth'

interface FormData {
  nickname: string
  birthYear: number
}

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'

export default function KakaoOnboardingPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()
  const setNickname = useSetKakaoNickname()

  const nicknameValue = watch('nickname') ?? ''
  const [debouncedNickname, setDebouncedNickname] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNickname(nicknameValue), 300)
    return () => clearTimeout(timer)
  }, [nicknameValue])

  const nicknameCheckEnabled =
    debouncedNickname.length >= 2 && /^[가-힣a-zA-Z0-9]+$/.test(debouncedNickname)

  const { data: nicknameCheckData } = useQuery({
    queryKey: ['nickname-check', debouncedNickname],
    queryFn: () =>
      api.get<{ available: boolean }>('/users/check-nickname', {
        params: { nickname: debouncedNickname },
      }).then((r) => r.data),
    enabled: nicknameCheckEnabled,
  })

  const nicknameTaken = nicknameCheckEnabled && nicknameCheckData?.available === false

  const onSubmit = (data: FormData) => {
    if (nicknameTaken) return
    setNickname.mutate({ nickname: data.nickname, birthYear: Number(data.birthYear) })
  }

  const getErrorMessage = () => {
    if (!setNickname.error) return null
    const axiosError = setNickname.error as AxiosError<{ message: string }>
    return axiosError.response?.data?.message ?? '닉네임 설정에 실패했어요. 다시 시도해 주세요.'
  }

  return (
    <AuthLayout>
      <div
        className="w-full rounded-3xl bg-white px-8 py-10"
        style={{ boxShadow: '0 8px 40px oklch(0.62 0.15 220 / 0.12)' }}
      >
        <div className="text-center mb-8 space-y-2">
          <h1
            className="text-3xl font-black text-foreground"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            거의 다 됐어요!
          </h1>
          <p className="text-lg text-foreground/70 font-medium leading-relaxed">
            닉네임과 출생연도를 입력하면
            <br />
            서비스를 바로 시작할 수 있어요.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-lg font-semibold text-foreground">
              닉네임
            </Label>
            <Input
              id="nickname"
              className="h-14 text-lg px-4 rounded-xl border-2"
              placeholder="닉네임을 입력하세요 (2~12자)"
              {...register('nickname', {
                required: '닉네임을 입력하세요',
                minLength: { value: 2, message: '닉네임은 2자 이상 입력하세요' },
                maxLength: { value: 12, message: '닉네임은 12자 이하로 입력하세요' },
                pattern: {
                  value: /^[가-힣a-zA-Z0-9]+$/,
                  message: '닉네임은 한글, 영문, 숫자만 사용할 수 있어요',
                },
              })}
            />
            {errors.nickname && (
              <p className="text-base text-destructive font-medium" role="alert">
                {errors.nickname.message}
              </p>
            )}
            {!errors.nickname && nicknameTaken && (
              <p className="text-base text-destructive font-medium" role="alert">
                이미 사용 중인 닉네임이에요
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthYear" className="text-lg font-semibold text-foreground">
              출생연도
            </Label>
            <Input
              id="birthYear"
              type="number"
              className="h-14 text-lg px-4 rounded-xl border-2"
              placeholder="예: 1965"
              {...register('birthYear', {
                required: '출생연도를 입력하세요',
                min: { value: 1900, message: '올바른 출생연도를 입력하세요' },
                max: { value: 2010, message: '올바른 출생연도를 입력하세요' },
                valueAsNumber: true,
                validate: (v) => (new Date().getFullYear() - v) >= 50 || '이 서비스는 50세 이상만 이용 가능해요',
              })}
            />
            {errors.birthYear && (
              <p className="text-base text-destructive font-medium" role="alert">
                {errors.birthYear.message}
              </p>
            )}
          </div>

          {setNickname.isError && (
            <p className="text-base text-destructive font-medium text-center" role="alert" aria-live="assertive">
              {getErrorMessage()}
            </p>
          )}

          <button
            type="submit"
            disabled={setNickname.isPending || nicknameTaken}
            className="w-full h-16 text-xl font-black rounded-2xl text-white mt-2
                       transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{
              background: setNickname.isPending ? 'oklch(0.76 0.12 220)' : warmBlueGradient,
            }}
            aria-busy={setNickname.isPending}
          >
            {setNickname.isPending ? '설정 중이에요...' : '시작하기'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
