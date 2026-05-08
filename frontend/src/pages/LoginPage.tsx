import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card'
import AuthLayout from '@/components/layout/AuthLayout'
import { useLogin } from '@/hooks/useAuth'
import type { LoginRequest } from '@/types/auth'

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
      <Card className="w-full">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-bold">로그인</CardTitle>
          <CardDescription className="text-foreground text-lg mt-2">
            계정에 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold">이메일</Label>
              <Input
                id="email"
                type="email"
                className="h-14 text-lg px-4"
                placeholder="이메일을 입력하세요"
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
                placeholder="비밀번호를 입력하세요"
                {...register('password', { required: '비밀번호를 입력하세요' })}
              />
              {errors.password && (
                <p className="text-base text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>
            {login.isError && (
              <p className="text-base text-destructive font-medium text-center">
                {getErrorMessage()}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold mt-2"
              disabled={login.isPending}
            >
              {login.isPending ? '로그인 중...' : '로그인'}
            </Button>
            <p className="text-base text-center text-muted-foreground pt-2">
              계정이 없으신가요?{' '}
              <Link to="/register" className="text-primary underline underline-offset-4 font-semibold">
                회원가입
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
