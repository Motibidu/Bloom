import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import AuthLayout from '@/components/layout/AuthLayout'
import api from '@/lib/api'
import { useRegister } from '@/hooks/useAuth'
import type { RegisterRequest } from '@/types/auth'

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'
const warmBlueDark = 'oklch(0.48 0.15 220)' as const
const warmBlueMain = 'oklch(0.62 0.15 220)' as const
const mainA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

type FormValues = RegisterRequest & { passwordConfirm: string; agreeTerms: boolean }

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<FormValues>()
  const registerMutation = useRegister()

  const nicknameValue = watch('nickname') ?? ''
  const bioValue = watch('bio') ?? ''
  const passwordValue = watch('password') ?? ''
  const emailValue = watch('email') ?? ''

  const [debouncedNickname, setDebouncedNickname] = useState('')

  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNickname(nicknameValue), 300)
    return () => clearTimeout(timer)
  }, [nicknameValue])

  useEffect(() => {
    setIsEmailVerified(false)
    setCodeSent(false)
    setVerifyCode('')
    setEmailError(null)
    setVerifyError(null)
  }, [emailValue])

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

  const handleSendCode = async () => {
    if (!emailValue || !/\S+@\S+\.\S+/.test(emailValue)) {
      setEmailError('올바른 이메일을 먼저 입력해 주세요')
      return
    }
    setSendingCode(true)
    setEmailError(null)
    try {
      await api.post('/auth/email/send', { email: emailValue })
      setCodeSent(true)
    } catch (e) {
      const err = e as AxiosError<{ message: string }>
      setEmailError(err.response?.data?.message ?? '인증 코드 발송에 실패했어요')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verifyCode.length !== 6) {
      setVerifyError('6자리 코드를 입력해 주세요')
      return
    }
    setVerifyingCode(true)
    setVerifyError(null)
    try {
      await api.post('/auth/email/verify', { email: emailValue, code: verifyCode })
      setIsEmailVerified(true)
    } catch (e) {
      const err = e as AxiosError<{ message: string }>
      setVerifyError(err.response?.data?.message ?? '인증에 실패했어요')
    } finally {
      setVerifyingCode(false)
    }
  }

  const onSubmit = (data: FormValues) => {
    if (nicknameTaken || !isEmailVerified) return
    const { passwordConfirm: _, agreeTerms: __, ...registerData } = data
    registerMutation.mutate(registerData)
  }

  const getErrorMessage = () => {
    if (!registerMutation.error) return null
    const axiosError = registerMutation.error as AxiosError<{ message: string }>
    return axiosError.response?.data?.message ?? '회원가입에 실패했어요. 다시 시도해 주세요.'
  }

  const currentYear = new Date().getFullYear()
  const maxBirthYear = currentYear - 50

  return (
    <AuthLayout>
      <div
        className="w-full rounded-3xl bg-white px-8 py-10"
        style={{ boxShadow: '0 8px 40px oklch(0.62 0.15 220 / 0.12)' }}
      >
        {/* 헤더 */}
        <div className="text-center mb-8 space-y-2">
          <h1
            className="text-3xl font-black text-foreground"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            회원가입
          </h1>
          <p className="text-lg text-foreground/70 font-medium">
            새 계정을 만드세요
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-lg font-semibold text-foreground">
              이메일
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                className="h-14 text-lg px-4 rounded-xl border-2 flex-1"
                placeholder="예: hong@naver.com"
                disabled={isEmailVerified}
                {...register('email', {
                  required: '이메일을 입력하세요',
                  pattern: { value: /\S+@\S+\.\S+/, message: '올바른 이메일 형식이 아닙니다' },
                })}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isEmailVerified || sendingCode}
                className="h-14 px-4 rounded-xl text-base font-bold border-2 bg-white
                           transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                           whitespace-nowrap"
                style={{ borderColor: warmBlueMain, color: warmBlueDark }}
              >
                {isEmailVerified ? '인증완료' : sendingCode ? '발송 중...' : codeSent ? '재발송' : '인증코드 발송'}
              </button>
            </div>
            {errors.email && (
              <p className="text-base text-destructive font-medium" role="alert">{errors.email.message}</p>
            )}
            {emailError && (
              <p className="text-base text-destructive font-medium" role="alert">{emailError}</p>
            )}
          </div>

          {/* 인증 코드 입력 */}
          {codeSent && !isEmailVerified && (
            <div className="space-y-2">
              <Label htmlFor="verifyCode" className="text-lg font-semibold text-foreground">
                인증 코드
              </Label>
              <div className="flex gap-2">
                <Input
                  id="verifyCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-14 text-lg px-4 rounded-xl border-2 flex-1 tracking-widest"
                  placeholder="6자리 코드 입력"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyingCode}
                  className="h-14 px-5 rounded-xl text-base font-bold text-white
                             transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{ background: warmBlueGradient }}
                >
                  {verifyingCode ? '확인 중...' : '확인'}
                </button>
              </div>
              {verifyError && (
                <p className="text-base text-destructive font-medium" role="alert">{verifyError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                메일로 발송된 6자리 코드를 10분 이내에 입력해 주세요.
              </p>
            </div>
          )}
          {isEmailVerified && (
            <p
              className="text-base font-semibold"
              style={{ color: 'oklch(0.55 0.15 150)' }}
            >
              이메일 인증이 완료되었어요.
            </p>
          )}

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-lg font-semibold text-foreground">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              className="h-14 text-lg px-4 rounded-xl border-2"
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
              <p className="text-base text-destructive font-medium" role="alert">{errors.password.message}</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm" className="text-lg font-semibold text-foreground">
              비밀번호 확인
            </Label>
            <Input
              id="passwordConfirm"
              type="password"
              className="h-14 text-lg px-4 rounded-xl border-2"
              placeholder="비밀번호를 다시 입력하세요"
              {...register('passwordConfirm', {
                required: '비밀번호 확인을 입력하세요',
                validate: (v) => v === passwordValue || '비밀번호가 일치하지 않아요',
              })}
            />
            {errors.passwordConfirm && (
              <p className="text-base text-destructive font-medium" role="alert">{errors.passwordConfirm.message}</p>
            )}
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-lg font-semibold text-foreground">
              이름 <span className="text-sm font-normal text-muted-foreground">(선택)</span>
            </Label>
            <Input
              id="name"
              className="h-14 text-lg px-4 rounded-xl border-2"
              placeholder="실명을 입력하세요 (선택)"
              {...register('name', { maxLength: { value: 30, message: '30자 이하로 입력하세요' } })}
            />
            {errors.name && (
              <p className="text-base text-destructive font-medium" role="alert">{errors.name.message}</p>
            )}
          </div>

          {/* 닉네임 */}
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
              <p className="text-base text-destructive font-medium" role="alert">{errors.nickname.message}</p>
            )}
            {!errors.nickname && nicknameTaken && (
              <p className="text-base text-destructive font-medium" role="alert">이미 사용 중인 닉네임이에요</p>
            )}
          </div>

          {/* 자기소개 */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-lg font-semibold text-foreground">
              자기소개{' '}
              <span className="text-sm font-normal text-muted-foreground">(선택, 최대 50자)</span>
            </Label>
            <Textarea
              id="bio"
              className="text-lg px-4 py-3 rounded-xl border-2 resize-none"
              rows={3}
              placeholder="간단한 자기소개를 입력하세요 (선택)"
              maxLength={50}
              {...register('bio', { maxLength: { value: 50, message: '50자 이하로 입력하세요' } })}
            />
            <p className="text-sm text-muted-foreground text-right">{bioValue.length}/50</p>
            {errors.bio && (
              <p className="text-base text-destructive font-medium" role="alert">{errors.bio.message}</p>
            )}
          </div>

          {/* 생년월일 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-lg font-semibold text-foreground">생년월일</Label>
              <span className="text-sm text-muted-foreground font-medium">{maxBirthYear}년생부터 가입 가능해요</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* 연도 */}
              <div className="relative">
                <select
                  id="birthYear"
                  className="w-full h-14 text-lg px-4 pr-10 rounded-xl border-2 border-input bg-white
                             appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  defaultValue=""
                  {...register('birthYear', {
                    required: '연도를 선택하세요',
                    valueAsNumber: true,
                    validate: (v) => v <= maxBirthYear || '이 서비스는 50세 이상만 이용 가능해요',
                  })}
                >
                  <option value="" disabled>연도</option>
                  {Array.from({ length: maxBirthYear - 1900 + 1 }, (_, i) => maxBirthYear - i).map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▼</span>
              </div>
              {/* 월 */}
              <div className="relative">
                <select
                  id="birthMonth"
                  className="w-full h-14 text-lg px-4 pr-10 rounded-xl border-2 border-input bg-white
                             appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  defaultValue=""
                  {...register('birthMonth', { required: '월을 선택하세요', valueAsNumber: true })}
                >
                  <option value="" disabled>월</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▼</span>
              </div>
              {/* 일 */}
              <div className="relative">
                <select
                  id="birthDay"
                  className="w-full h-14 text-lg px-4 pr-10 rounded-xl border-2 border-input bg-white
                             appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  defaultValue=""
                  {...register('birthDay', { required: '일을 선택하세요', valueAsNumber: true })}
                >
                  <option value="" disabled>일</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}일</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▼</span>
              </div>
            </div>
            {(errors.birthYear || errors.birthMonth || errors.birthDay) && (
              <p className="text-base text-destructive font-medium" role="alert">
                {errors.birthYear?.message || errors.birthMonth?.message || errors.birthDay?.message}
              </p>
            )}
          </div>

          {/* 약관 동의 */}
          <div className="space-y-2">
            <div
              className="flex items-start gap-3 p-4 rounded-xl border-2"
              style={{ borderColor: mainA(0.25), background: mainA(0.04) }}
            >
              <Checkbox
                id="agreeTerms"
                className="mt-0.5 h-5 w-5 shrink-0"
                {...register('agreeTerms', { required: '약관에 동의해 주세요' })}
                onCheckedChange={(checked) =>
                  setValue('agreeTerms', !!checked, { shouldValidate: true })
                }
              />
              <Label htmlFor="agreeTerms" className="text-base font-medium leading-snug cursor-pointer text-foreground">
                <span className="font-bold" style={{ color: warmBlueDark }}>[필수]</span>{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  className="underline underline-offset-2"
                  style={{ color: warmBlueDark }}
                  onClick={(e) => e.stopPropagation()}
                >
                  서비스 이용약관
                </Link>
                {' '}및{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  className="underline underline-offset-2"
                  style={{ color: warmBlueDark }}
                  onClick={(e) => e.stopPropagation()}
                >
                  개인정보 처리방침
                </Link>
                에 동의합니다. 생년월일 등 허위 정보 입력 시 이용약관 위반으로 서비스 이용이 제한될 수 있습니다.
              </Label>
            </div>
            {errors.agreeTerms && (
              <p className="text-base text-destructive font-medium" role="alert">{errors.agreeTerms.message}</p>
            )}
          </div>

          {/* API 오류 */}
          {registerMutation.isError && (
            <p className="text-base text-destructive font-medium text-center" role="alert">
              {getErrorMessage()}
            </p>
          )}

          {/* 가입하기 버튼 */}
          <button
            type="submit"
            disabled={registerMutation.isPending || nicknameTaken || !isEmailVerified}
            className="w-full h-16 text-xl font-black rounded-2xl text-white mt-2
                       transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ background: registerMutation.isPending ? 'oklch(0.76 0.12 220)' : warmBlueGradient }}
            aria-busy={registerMutation.isPending}
          >
            {registerMutation.isPending ? '가입하는 중이에요...' : '가입하기'}
          </button>

          <p className="text-base text-center text-muted-foreground pt-2">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="underline underline-offset-4 font-semibold"
              style={{ color: warmBlueDark }}
            >
              로그인
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
