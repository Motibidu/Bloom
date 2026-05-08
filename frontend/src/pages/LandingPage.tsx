import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/shadcn/button'

const CATEGORIES = [
  { label: '산책', emoji: '🚶' },
  { label: '요리', emoji: '🍳' },
  { label: '독서', emoji: '📚' },
  { label: '정원 가꾸기', emoji: '🌱' },
  { label: '운동', emoji: '💪' },
  { label: '친구 만남', emoji: '🤝' },
  { label: '기타', emoji: '✨' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <span className="text-xl font-extrabold text-primary tracking-tight">
          오늘 뭐 했어요?
        </span>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-base">로그인</Button>
          </Link>
          <Link to="/register">
            <Button className="text-base">회원가입</Button>
          </Link>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center gap-8">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            오늘 하루, 무엇을 하셨나요?
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            나의 소소한 일상을 기록하고,<br />
            같은 활동을 한 이웃과 자연스럽게 연결되어 보세요.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map(({ label, emoji }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-muted-foreground text-base font-medium"
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto min-h-14 text-lg px-10">
              지금 시작하기
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-14 text-lg px-10">
              로그인
            </Button>
          </Link>
        </div>
      </section>

      {/* 소개 섹션 */}
      <section className="bg-muted/40 border-t border-border px-6 py-16">
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <div className="space-y-3">
            <div className="text-4xl">📝</div>
            <h3 className="text-xl font-bold text-foreground">간단하게 기록</h3>
            <p className="text-base text-muted-foreground">
              카테고리를 고르고 한 줄만 쓰면 됩니다. 사진도 한 장 올릴 수 있어요.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-4xl">🤝</div>
            <h3 className="text-xl font-bold text-foreground">이웃과 연결</h3>
            <p className="text-base text-muted-foreground">
              같은 활동을 한 사람이 몇 명인지 확인하고 자연스럽게 공감을 나눠 보세요.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-4xl">📅</div>
            <h3 className="text-xl font-bold text-foreground">나의 기록 보기</h3>
            <p className="text-base text-muted-foreground">
              캘린더로 내 활동 이력을 한눈에 확인하고 꾸준함을 느껴 보세요.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        © 2025 오늘 뭐 했어요?
      </footer>
    </div>
  )
}
