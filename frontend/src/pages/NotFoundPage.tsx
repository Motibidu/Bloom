import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/shadcn/button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center bg-background">
      <SearchX size={72} className="text-muted-foreground" strokeWidth={1.5} />
      <div className="space-y-2">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="text-2xl font-semibold text-foreground">페이지를 찾을 수 없습니다</p>
        <p className="text-lg text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
      </div>
      <Button size="lg" className="min-h-14 text-lg px-10 mt-2" onClick={() => navigate('/feed')}>
        홈으로 돌아가기
      </Button>
    </div>
  )
}
