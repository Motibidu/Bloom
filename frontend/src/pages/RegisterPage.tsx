import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog'
import AuthLayout from '@/components/layout/AuthLayout'
import api from '@/lib/api'
import { useRegister } from '@/hooks/useAuth'
import type { RegisterRequest } from '@/types/auth'

const grad = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'
const dark = 'oklch(0.48 0.15 220)' as const
const main = 'oklch(0.62 0.15 220)' as const
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`

type FormValues = RegisterRequest & { passwordConfirm: string; agreeTerms: boolean }

const STEPS = ['약관 동의', '계정 정보', '프로필'] as const

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const inviteCode = searchParams.get('inviteCode') ?? undefined

  const { register, handleSubmit, watch, formState: { errors }, setValue, trigger } = useForm<FormValues>({
    defaultValues: { agreeTerms: false },
  })
  const registerMutation = useRegister()

  const [step, setStep] = useState(0)
  const [policyModal, setPolicyModal] = useState<'terms' | 'privacy' | null>(null)

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

  const handleNext = async () => {
    if (step === 0) {
      const ok = await trigger('agreeTerms')
      if (ok) setStep(1)
    } else if (step === 1) {
      const ok = await trigger(['email', 'password', 'passwordConfirm'])
      if (!ok) return
      if (!isEmailVerified) {
        setEmailError('이메일 인증을 완료해 주세요')
        return
      }
      setStep(2)
    }
  }

  const onSubmit = (data: FormValues) => {
    if (nicknameTaken || !isEmailVerified) return
    const { passwordConfirm: _, agreeTerms: __, ...registerData } = data
    registerMutation.mutate({ ...registerData, inviteCode })
  }

  const getErrorMessage = () => {
    if (!registerMutation.error) return null
    const axiosError = registerMutation.error as AxiosError<{ message: string }>
    return axiosError.response?.data?.message ?? '회원가입에 실패했어요. 다시 시도해 주세요.'
  }

  const currentYear = new Date().getFullYear()
  const maxBirthYear = currentYear - 50
  const isInvited = !!inviteCode

  return (
    <AuthLayout>
      <div
        className="w-full rounded-none sm:rounded-3xl bg-white px-5 sm:px-8 py-8 sm:py-10"
        style={{ boxShadow: '0 8px 40px oklch(0.62 0.15 220 / 0.12)' }}
      >
        {/* 헤더 */}
        <div className="text-center mb-6 space-y-2">
          <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            회원가입
          </h1>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black transition-all"
                  style={
                    i < step
                      ? { background: grad, color: 'white' }
                      : i === step
                      ? { background: grad, color: 'white', boxShadow: `0 0 0 3px ${mA(0.2)}` }
                      : { background: mA(0.08), color: mA(0.4) }
                  }
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className="text-base font-bold truncate"
                  style={{ color: i <= step ? dark : mA(0.5) }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-1 rounded-full mx-1 transition-all"
                  style={{ background: i < step ? grad : mA(0.12) }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Step 1: 약관 동의 ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  서비스 이용을 위해 아래 약관에 동의해 주세요.
                </p>
                {!isInvited && (
                  <p className="text-base font-medium" style={{ color: dark }}>
                    <span className="font-black">{maxBirthYear}년생 이상</span>만 이용할 수 있어요.
                  </p>
                )}
                {isInvited && (
                  <p className="text-base font-medium" style={{ color: dark }}>
                    가족 초대 코드로 가입하시면 나이 제한 없이 가입할 수 있어요.
                  </p>
                )}
              </div>

              <div
                className="flex items-start gap-3 p-5 rounded-xl border-2"
                style={{ borderColor: mA(0.35), background: mA(0.04) }}
              >
                <Checkbox
                  id="agreeTerms"
                  className="mt-0.5 h-8 w-8 shrink-0"
                  checked={!!watch('agreeTerms')}
                  onCheckedChange={(checked) =>
                    setValue('agreeTerms', !!checked, { shouldValidate: true })
                  }
                />
                <input
                  type="hidden"
                  {...register('agreeTerms', {
                    validate: (v) => !!v || '약관에 동의해 주세요',
                  })}
                />
                <Label htmlFor="agreeTerms" className="text-base font-medium leading-relaxed cursor-default text-foreground">
                  <span className="font-bold" style={{ color: dark }}>[필수]</span>{' '}
                  <button
                    type="button"
                    className="underline underline-offset-2 font-semibold"
                    style={{ color: dark }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPolicyModal('terms') }}
                  >
                    서비스 이용약관
                  </button>
                  {' '}및{' '}
                  <button
                    type="button"
                    className="underline underline-offset-2 font-semibold"
                    style={{ color: dark }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPolicyModal('privacy') }}
                  >
                    개인정보 처리방침
                  </button>
                  에 동의합니다.
                  <span className="block mt-1 text-sm text-muted-foreground">
                    생년월일 등 허위 정보 입력 시 이용약관 위반으로 서비스 이용이 제한될 수 있습니다.
                  </span>
                </Label>
              </div>
              {errors.agreeTerms && (
                <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">
                  {errors.agreeTerms.message}
                </p>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="w-full h-16 text-xl font-black rounded-2xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: grad }}
              >
                동의하고 계속하기
              </button>
            </div>
          )}

          {/* ── Step 2: 계정 정보 ── */}
          {step === 1 && (
            <div className="space-y-6">
              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg font-semibold text-foreground">이메일</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    className="h-14 text-lg px-4 rounded-xl border-2 flex-1 bg-white"
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
                    className="h-14 px-4 rounded-xl text-base font-bold border-2 bg-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 whitespace-nowrap"
                    style={{ borderColor: main, color: dark }}
                  >
                    {isEmailVerified ? '인증완료' : sendingCode ? '발송 중...' : codeSent ? '재발송' : '인증코드 발송'}
                  </button>
                </div>
                {errors.email && (
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">{errors.email.message}</p>
                )}
                {emailError && (
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">{emailError}</p>
                )}
              </div>

              {/* 인증 코드 */}
              {codeSent && !isEmailVerified && (
                <div className="space-y-2">
                  <Label htmlFor="verifyCode" className="text-lg font-semibold text-foreground">인증 코드</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verifyCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="h-14 text-lg px-4 rounded-xl border-2 flex-1 tracking-widest bg-white"
                      placeholder="6자리 코드 입력"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifyingCode}
                      className="h-14 px-5 rounded-xl text-base font-bold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{ background: grad }}
                    >
                      {verifyingCode ? '확인 중...' : '확인'}
                    </button>
                  </div>
                  {verifyError && (
                    <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">{verifyError}</p>
                  )}
                  <p className="text-sm text-muted-foreground">메일로 발송된 6자리 코드를 10분 이내에 입력해 주세요.</p>
                </div>
              )}
              {isEmailVerified && (
                <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.15 150)' }}>
                  ✓ 이메일 인증이 완료되었어요.
                </p>
              )}

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-lg font-semibold text-foreground">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-14 text-lg px-4 rounded-xl border-2 bg-white"
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
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">{errors.password.message}</p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-lg font-semibold text-foreground">비밀번호 확인</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  className="h-14 text-lg px-4 rounded-xl border-2 bg-white"
                  placeholder="비밀번호를 다시 입력하세요"
                  {...register('passwordConfirm', {
                    required: '비밀번호 확인을 입력하세요',
                    validate: (v) => v === passwordValue || '비밀번호가 일치하지 않아요',
                  })}
                />
                {errors.passwordConfirm && (
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">{errors.passwordConfirm.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="h-14 px-6 text-lg font-bold rounded-2xl border-2 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: main, color: dark }}
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-14 text-lg font-black rounded-2xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: grad }}
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: 프로필 ── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* 닉네임 */}
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-lg font-semibold text-foreground">닉네임</Label>
                <Input
                  id="nickname"
                  className="h-14 text-lg px-4 rounded-xl border-2 bg-white"
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
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">{errors.nickname.message}</p>
                )}
                {!errors.nickname && nicknameTaken && (
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">이미 사용 중인 닉네임이에요</p>
                )}
              </div>

              {/* 생년월일 */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-lg font-semibold text-foreground">생년월일</Label>
                  {!isInvited && (
                    <span className="text-sm text-muted-foreground font-medium">{maxBirthYear}년생부터 가입 가능해요</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <select
                      id="birthYear"
                      className="w-full h-14 text-lg px-4 pr-10 rounded-xl border-2 border-input bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      defaultValue=""
                      {...register('birthYear', {
                        required: '연도를 선택하세요',
                        valueAsNumber: true,
                        validate: isInvited
                          ? undefined
                          : (v) => v <= maxBirthYear || '이 서비스는 50세 이상만 이용 가능해요',
                      })}
                    >
                      <option value="" disabled>연도</option>
                      {Array.from(
                        { length: (isInvited ? currentYear : maxBirthYear) - 1900 + 1 },
                        (_, i) => (isInvited ? currentYear : maxBirthYear) - i
                      ).map((y) => (
                        <option key={y} value={y}>{y}년</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▼</span>
                  </div>
                  <div className="relative">
                    <select
                      id="birthMonth"
                      className="w-full h-14 text-lg px-4 pr-10 rounded-xl border-2 border-input bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                  <div className="relative">
                    <select
                      id="birthDay"
                      className="w-full h-14 text-lg px-4 pr-10 rounded-xl border-2 border-input bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">
                    {errors.birthYear?.message || errors.birthMonth?.message || errors.birthDay?.message}
                  </p>
                )}
              </div>

              {/* 이름 (선택) */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg font-semibold text-foreground">
                  이름 <span className="text-sm font-normal text-muted-foreground">(선택)</span>
                </Label>
                <Input
                  id="name"
                  className="h-14 text-lg px-4 rounded-xl border-2 bg-white"
                  placeholder="실명을 입력하세요 (선택)"
                  {...register('name', { maxLength: { value: 30, message: '30자 이하로 입력하세요' } })}
                />
                {errors.name && (
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">{errors.name.message}</p>
                )}
              </div>

              {/* 자기소개 (선택) */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-lg font-semibold text-foreground">
                  자기소개 <span className="text-sm font-normal text-muted-foreground">(선택, 최대 50자)</span>
                </Label>
                <Textarea
                  id="bio"
                  className="text-lg px-4 py-3 rounded-xl border-2 resize-none bg-white"
                  rows={3}
                  placeholder="간단한 자기소개를 입력하세요 (선택)"
                  maxLength={50}
                  {...register('bio', { maxLength: { value: 50, message: '50자 이하로 입력하세요' } })}
                />
                <p className="text-sm text-muted-foreground text-right">{bioValue.length}/50</p>
                {errors.bio && (
                  <p className="text-base font-semibold" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">{errors.bio.message}</p>
                )}
              </div>

              {/* API 오류 */}
              {registerMutation.isError && (
                <p className="text-base font-semibold text-center" style={{ color: 'oklch(0.55 0.2 25)' }} role="alert">
                  {getErrorMessage()}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-16 px-6 text-lg font-bold rounded-2xl border-2 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: main, color: dark }}
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending || nicknameTaken || !isEmailVerified}
                  className="flex-1 h-16 text-xl font-black rounded-2xl text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: registerMutation.isPending ? 'oklch(0.76 0.12 220)' : grad }}
                  aria-busy={registerMutation.isPending}
                >
                  {registerMutation.isPending ? '가입하는 중이에요...' : '가입하기'}
                </button>
              </div>
            </div>
          )}

          {/* 로그인 링크 */}
          <p className="text-base text-center text-muted-foreground pt-1">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="underline underline-offset-4 font-semibold" style={{ color: dark }}>
              로그인
            </Link>
          </p>
        </form>
      </div>

      {/* 약관 모달 */}
      <Dialog open={policyModal !== null} onOpenChange={(open) => { if (!open) setPolicyModal(null) }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-0 p-0 rounded-3xl overflow-hidden">
          <DialogHeader className="px-7 pt-7 pb-4 shrink-0">
            <DialogTitle className="text-2xl font-black text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              {policyModal === 'terms' ? '서비스 이용약관' : '개인정보 처리방침'}
            </DialogTitle>
            <p className="text-sm text-foreground/60 mt-1">최종 수정일: 2025년 5월 25일</p>
          </DialogHeader>
          <div className="overflow-y-auto px-7 pb-7 flex-1">
            {policyModal === 'terms' ? <TermsContent /> : <PrivacyContent />}
          </div>
          <div className="px-7 pb-7 pt-4 shrink-0 border-t">
            <button
              type="button"
              className="w-full h-14 text-lg font-bold rounded-2xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: grad }}
              onClick={() => setPolicyModal(null)}
            >
              확인
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  )
}

const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

function TermsContent() {
  return (
    <div className="space-y-6 text-base text-foreground/80 leading-relaxed pt-2">
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제1조 (목적)</h2>
        <p>이 약관은 "오늘 뭐 했어요?" (이하 "서비스")가 제공하는 일상 활동 기록 및 소셜 연결 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제2조 (이용 자격)</h2>
        <p>서비스는 <span className="font-semibold">만 50세 이상</span>의 개인을 대상으로 합니다. 회원가입 시 입력하는 생년월일은 정확한 정보여야 하며, 허위 정보 입력 시 본 약관 제6조에 따라 이용이 제한될 수 있습니다.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제3조 (회원 가입 및 계정 관리)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>회원 가입은 이메일 인증을 통해 완료됩니다.</li>
          <li>하나의 이메일 주소로 하나의 계정만 생성할 수 있습니다.</li>
          <li>닉네임은 2~12자의 한글, 영문, 숫자로 구성해야 하며 중복될 수 없습니다.</li>
          <li>계정 정보는 타인과 공유하거나 양도할 수 없습니다.</li>
          <li>계정 보안의 책임은 회원 본인에게 있습니다.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제4조 (서비스 이용)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>회원은 일상 활동을 카테고리와 설명으로 기록하고 다른 회원과 공유할 수 있습니다.</li>
          <li>다른 회원의 활동에 좋아요, 댓글, 감정 반응을 남길 수 있습니다.</li>
          <li>가족 그룹을 생성하거나 초대 코드를 통해 참여할 수 있습니다.</li>
          <li>서비스는 원활한 운영을 위해 사전 통지 없이 일시적으로 중단될 수 있습니다.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제5조 (금지 행위)</h2>
        <p>회원은 다음 행위를 해서는 안 됩니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>허위 정보 (생년월일 포함) 등록</li>
          <li>다른 회원의 개인정보 무단 수집 또는 침해</li>
          <li>음란물, 혐오 표현, 폭력적 콘텐츠 게시</li>
          <li>스팸, 광고성 콘텐츠 반복 게시</li>
          <li>서비스 시스템에 대한 해킹, 악성 코드 배포</li>
          <li>타인을 사칭하거나 허위 사실 유포</li>
          <li>기타 관계 법령을 위반하는 행위</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제6조 (이용 제한 및 계정 정지)</h2>
        <p>서비스는 회원이 본 약관을 위반하거나 다음에 해당하는 경우 사전 통지 없이 서비스 이용을 제한하거나 계정을 정지·삭제할 수 있습니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>생년월일 등 허위 정보를 입력한 경우</li>
          <li>다른 회원으로부터 신고가 누적된 경우</li>
          <li>제5조의 금지 행위를 한 경우</li>
          <li>서비스의 정상적인 운영을 방해하는 경우</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제7조 (콘텐츠의 권리)</h2>
        <p>회원이 서비스에 게시한 콘텐츠(텍스트, 사진 등)의 저작권은 해당 회원에게 있습니다. 단, 서비스 운영 및 홍보 목적으로 해당 콘텐츠를 사용할 수 있으며, 회원은 이에 동의합니다.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제8조 (면책 조항)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스는 회원 간의 분쟁에 개입하지 않으며 이에 대한 책임을 지지 않습니다.</li>
          <li>천재지변, 서버 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
          <li>회원이 게시한 콘텐츠로 인해 발생한 문제에 대한 책임은 해당 회원에게 있습니다.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제9조 (약관 변경)</h2>
        <p>서비스는 필요 시 약관을 변경할 수 있으며, 변경 시 서비스 내 공지사항을 통해 7일 전에 고지합니다. 변경된 약관에 동의하지 않는 경우 탈퇴할 수 있으며, 고지 기간 이후 계속 이용하면 변경된 약관에 동의한 것으로 간주합니다.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>제10조 (준거법 및 관할)</h2>
        <p>이 약관은 대한민국 법률에 따르며, 분쟁 발생 시 대한민국 법원을 관할 법원으로 합니다.</p>
      </section>
    </div>
  )
}

function PrivacyContent() {
  return (
    <div className="space-y-6 text-base text-foreground/80 leading-relaxed pt-2">
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>1. 개인정보의 수집 및 이용 목적</h2>
        <p>"오늘 뭐 했어요?" (이하 "서비스")는 다음의 목적으로 개인정보를 수집·이용합니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>회원 가입 및 본인 확인</li>
          <li>서비스 제공 및 운영 (활동 기록, 소셜 연결 기능)</li>
          <li>이메일 인증을 통한 계정 보안</li>
          <li>서비스 이용 내역 관리 및 고객 지원</li>
          <li>서비스 개선을 위한 이용 분석</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>2. 수집하는 개인정보 항목</h2>
        <p><span className="font-semibold">필수 항목</span>: 이메일 주소, 비밀번호, 닉네임, 생년월일</p>
        <p><span className="font-semibold">선택 항목</span>: 이름, 자기소개, 프로필 사진</p>
        <p><span className="font-semibold">자동 수집</span>: 서비스 이용 기록, 접속 로그, IP 주소</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>3. 개인정보의 보유 및 이용 기간</h2>
        <p>회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 별도 보관합니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>전자상거래 관련 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 및 분쟁 처리 기록: 3년 (전자상거래법)</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>4. 개인정보의 제3자 제공</h2>
        <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 이용자의 사전 동의가 있거나 법령에 의한 경우에는 예외로 합니다.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>5. 개인정보 처리의 위탁</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Amazon Web Services (AWS): 서버 및 데이터 저장소 운영</li>
          <li>Google (Firebase): 푸시 알림 서비스 운영</li>
          <li>Google: 이메일 발송 (Gmail SMTP)</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>6. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>개인정보 처리 현황 조회 및 열람 요청</li>
          <li>개인정보 수정 및 삭제 요청</li>
          <li>개인정보 처리 정지 요청</li>
          <li>회원 탈퇴 (서비스 내 프로필 설정에서 가능)</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>7. 개인정보 보호책임자</h2>
        <p>개인정보 관련 문의사항은 아래로 연락해 주세요.</p>
        <p className="font-medium">이메일: jack981109@gmail.com</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground" style={serifStyle}>8. 개인정보 처리방침 변경</h2>
        <p>이 개인정보 처리방침은 법령·정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시 변경 사유 및 내용을 서비스 내 공지사항을 통해 고지합니다.</p>
      </section>
    </div>
  )
}
