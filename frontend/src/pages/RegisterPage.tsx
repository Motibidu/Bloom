import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card'
import AuthLayout from '@/components/layout/AuthLayout'
import api from '@/lib/api'
import { useRegister } from '@/hooks/useAuth'
import type { RegisterRequest } from '@/types/auth'

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterRequest>()
  const registerMutation = useRegister()

  const nicknameValue = watch('nickname') ?? ''
  const bioValue = watch('bio') ?? ''

  const [debouncedNickname, setDebouncedNickname] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNickname(nicknameValue)
    }, 300)
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

  const onSubmit = (data: RegisterRequest) => {
    if (nicknameTaken) return
    registerMutation.mutate(data)
  }

  const getErrorMessage = () => {
    if (!registerMutation.error) return null
    const axiosError = registerMutation.error as AxiosError<{ message: string }>
    return axiosError.response?.data?.message ?? '회원가입에 실패했어요. 다시 시도해 주세요.'
  }

  return (
    <AuthLayout>
      <Card className="w-full">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-bold">회원가입</CardTitle>
          <CardDescription className="text-foreground text-lg mt-2">
            새 계정을 만드세요
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold">이메일</Label>
              <Input
                id="email"
                type="email"
                className="h-14 text-lg px-4"
                placeholder="example@email.com"
                {...register('email', {
                  required: '이메일을 입력하세요',
                  pattern: { value: /\S+@\S+\.\S+/, message: '올바른 이메일 형식이 아닙니다' },
                })}
              />
              {errors.email && (
                <p className="text-base text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-semibold">비밀번호</Label>
              <Input
                id="password"
                type="password"
                className="h-14 text-lg px-4"
                placeholder="영문, 숫자를 포함하여 8자 이상"
                {...register('password', {
                  required: '비밀번호를 입력하세요',
                  minLength: { value: 8, message: '8자 이상 입력하세요' },
                  pattern: {
                    value: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                    message: '비밀번호는 영문과 숫자를 모두 포함해야 해요',
                  },
                })}
              />
              {errors.password && (
                <p className="text-base text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-lg font-semibold">닉네임</Label>
              <Input
                id="nickname"
                className="h-14 text-lg px-4"
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
                <p className="text-base text-destructive font-medium">{errors.nickname.message}</p>
              )}
              {!errors.nickname && nicknameTaken && (
                <p className="text-base text-destructive font-medium">이미 사용 중인 닉네임이에요</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-lg font-semibold">
                자기소개 <span className="text-sm font-normal text-muted-foreground">(선택, 최대 50자)</span>
              </Label>
              <Textarea
                id="bio"
                className="text-lg px-4 py-3 resize-none"
                rows={3}
                placeholder="간단한 자기소개를 입력하세요 (선택)"
                maxLength={50}
                {...register('bio', { maxLength: { value: 50, message: '50자 이하로 입력하세요' } })}
              />
              <p className="text-sm text-muted-foreground text-right">{bioValue.length}/50</p>
              {errors.bio && (
                <p className="text-base text-destructive font-medium">{errors.bio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthYear" className="text-lg font-semibold">출생연도</Label>
              <Input
                id="birthYear"
                type="number"
                className="h-14 text-lg px-4"
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
                <p className="text-base text-destructive font-medium">{errors.birthYear.message}</p>
              )}
            </div>
            {registerMutation.isError && (
              <p className="text-base text-destructive font-medium text-center">
                {getErrorMessage()}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold mt-2"
              disabled={registerMutation.isPending || nicknameTaken}
            >
              {registerMutation.isPending ? '가입 중...' : '가입하기'}
            </Button>
            <p className="text-base text-center text-muted-foreground pt-2">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-primary underline underline-offset-4 font-semibold">
                로그인
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
