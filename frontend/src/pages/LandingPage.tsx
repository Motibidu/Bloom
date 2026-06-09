import { Link } from 'react-router-dom'
import {
  Footprints,
  ChefHat,
  BookOpen,
  Sprout,
  Dumbbell,
  Users,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Eye,
  PenLine,
  CalendarDays,
  Smile,
  Home,
  Bell,
  Link2,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import type { LucideIcon } from 'lucide-react'

// ─── 카테고리 뱃지 데이터 ──────────────────────────────────────────────────────

interface CategoryBadge {
  label: string
  icon: LucideIcon
}

const CATEGORY_BADGES: CategoryBadge[] = [
  { label: '산책',       icon: Footprints    },
  { label: '요리',       icon: ChefHat       },
  { label: '독서',       icon: BookOpen      },
  { label: '정원 가꾸기', icon: Sprout        },
  { label: '운동',       icon: Dumbbell      },
  { label: '친구 만남',  icon: Users         },
  { label: '기타',       icon: MoreHorizontal},
]

// ─── 피드 미리보기 더미 데이터 ───────────────────────────────────────────────

interface PreviewCard {
  id: number
  nickname: string
  initial: string
  categoryLabel: string
  categoryIcon: LucideIcon
  title: string
  description: string
  likeCount: number
  commentCount: number
  viewCount: number
  timeLabel: string
}

const PREVIEW_CARDS: PreviewCard[] = [
  {
    id: 1,
    nickname: '김영희',
    initial: '김',
    categoryLabel: '산책',
    categoryIcon: Footprints,
    title: '오늘 한강변 산책',
    description:
      '오늘은 날씨가 너무 좋아서 한강변을 한 시간 넘게 걸었어요. 벚꽃은 다 졌지만 초록 잎사귀가 예뻐서 기분이 상쾌해졌답니다.',
    likeCount: 12,
    commentCount: 4,
    viewCount: 38,
    timeLabel: '오늘 오전 10:22',
  },
  {
    id: 2,
    nickname: '박철수',
    initial: '박',
    categoryLabel: '요리',
    categoryIcon: ChefHat,
    title: '김치찌개 끓이기 성공',
    description:
      '딸아이가 요즘 바빠서 제가 직접 끓여봤는데, 맛있다고 두 그릇이나 먹더라고요. 오랜만에 칭찬받으니 어깨가 으쓱했어요.',
    likeCount: 8,
    commentCount: 3,
    viewCount: 21,
    timeLabel: '오늘 오전 12:05',
  },
  {
    id: 3,
    nickname: '이순자',
    initial: '이',
    categoryLabel: '독서',
    categoryIcon: BookOpen,
    title: '소설 한 챕터 완독',
    description:
      '점심 먹고 소파에 앉아 소설 한 챕터를 읽었어요. 오랜만에 집중해서 읽으니 마음이 차분해지고 뿌듯했습니다. 내일도 읽어야겠어요.',
    likeCount: 15,
    commentCount: 6,
    viewCount: 52,
    timeLabel: '오늘 오후 2:41',
  },
]

// ─── 특징 소개 데이터 ──────────────────────────────────────────────────────────

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: PenLine,
    title: '카테고리 한 번, 한 줄이면 끝이에요',
    description:
      '복잡한 앱 없이 카테고리를 고르고 한 줄만 쓰면 돼요. 사진도 최대 3장 올릴 수 있어요.',
  },
  {
    icon: Users,
    title: '혼자가 아니에요',
    description:
      '오늘 산책한 이웃이 몇 명인지 바로 보여요. 댓글과 칭찬카드로 공감을 나눠 보세요.',
  },
  {
    icon: CalendarDays,
    title: '한 달 뒤, 내가 얼마나 바빴는지 보여요',
    description:
      '캘린더로 내 활동을 돌아보고, 월간 리포트로 이달의 나를 확인해요.',
  },
]

// ─── 가족 기능 포인트 데이터 ───────────────────────────────────────────────────

interface FamilyPoint {
  icon: LucideIcon
  text: string
}

const FAMILY_POINTS: FamilyPoint[] = [
  {
    icon: Link2,
    text: '카카오톡 초대 링크 하나로 가족만 보는 공간 완성',
  },
  {
    icon: Home,
    text: '간편 기록은 가족에게만 공개 — 이웃 피드엔 노출 안 됨',
  },
  {
    icon: Bell,
    text: '"오늘 뭐 했어요?" 알림으로 서로 기록 독려',
  },
]

// ─── 히어로 우측 플로팅 카드 (데스크톱 only) ──────────────────────────────────

function FloatingPreviewCard({ card, main, dark, light }: { card: PreviewCard; main: string; dark: string; light: string }) {
  const CategoryIcon = card.categoryIcon
  const mainA = (a: number) => main.replace(')', ` / ${a})`)
  const lightA = (a: number) => light.replace(')', ` / ${a})`)
  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: `0 24px 60px ${mainA(0.20)}` }}
      aria-hidden="true"
    >
      <div className="px-5 pt-5 pb-4 space-y-2">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${mainA(0.2)}, ${lightA(0.2)})` }}
          >
            <span className="text-base font-black" style={{ color: dark }}>
              {card.initial}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-foreground">{card.nickname}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-foreground/60 font-medium">{card.timeLabel}</span>
              <CategoryIcon size={14} aria-hidden="true" style={{ color: dark }} />
            </div>
          </div>
        </div>
        <h3 className="text-base font-bold text-foreground leading-snug">{card.title}</h3>
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">{card.description}</p>
      </div>
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-5">
        {[
          { Icon: Heart, count: card.likeCount },
          { Icon: MessageCircle, count: card.commentCount },
          { Icon: Eye, count: card.viewCount },
        ].map(({ Icon, count }, i) => (
          <div key={i} className="flex items-center gap-1.5" style={{ color: dark }}>
            <Icon size={18} aria-hidden="true" />
            <span className="text-sm font-semibold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────────

const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mainA  = (a: number) => main.replace(')', ` / ${a})`)
const lightA = (a: number) => light.replace(')', ` / ${a})`)

export default function LandingPage() {

  const gradientBg = `linear-gradient(135deg, ${main}, ${light})`
  const gradientText: React.CSSProperties = {
    background: gradientBg,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }
  const coralColor = { color: dark }
  const coralBtn: React.CSSProperties = {
    background: gradientBg,
    color: 'white',
    transition: 'opacity 0.2s, transform 0.15s',
  }
  const badgeCoral: React.CSSProperties = {
    background: mainA(0.10),
    border: `1px solid ${mainA(0.25)}`,
    color: dark,
  }
  const featureIconBg: React.CSSProperties = {
    background: `linear-gradient(135deg, ${mainA(0.12)}, ${lightA(0.12)})`,
  }
  const heroBg: React.CSSProperties = {
    background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${lightA(0.18)} 0%, transparent 70%), ${mainA(0.05)}`,
  }
  const ctaBg: React.CSSProperties = {
    background: `linear-gradient(135deg, ${main}, ${light})`,
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      <Header variant="landing" />

      <main>

        {/* ── 히어로 섹션 ────────────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden px-6 pt-20 pb-28"
          style={heroBg}
        >
          {/* 배경 장식 orb */}
          <div
            className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full lp-orb-pulse pointer-events-none"
            style={{ background: `radial-gradient(circle, ${lightA(0.25)}, transparent 70%)` }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-[-60px] left-[-40px] w-64 h-64 rounded-full lp-orb-pulse pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${mainA(0.18)}, transparent 70%)`,
              animationDelay: '3s',
            }}
            aria-hidden="true"
          />

          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-14 relative">

            {/* 좌측 텍스트 */}
            <div className="flex-1 space-y-8 text-center md:text-left">

              <p
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold animate-fade-up"
                style={badgeCoral}
              >
                <Smile size={18} aria-hidden="true" />
                중장년 일상 기록 커뮤니티
              </p>

              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight text-foreground animate-fade-up"
                style={{ ...serifStyle, animationDelay: '0.1s', textWrap: 'balance', wordBreak: 'keep-all' } as React.CSSProperties}
              >
                오늘{' '}
                <span style={gradientText}>뭐 하셨어요?</span>
              </h1>

              <p
                className="text-lg sm:text-xl text-foreground/70 leading-relaxed font-medium animate-fade-up"
                style={{ animationDelay: '0.2s', wordBreak: 'keep-all' }}
              >
                산책, 요리, 독서 — 내 하루를 기록하면 오늘 같은 활동을 한 이웃이 보여요.
                가족도 내 일상을 응원해줘요.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-up"
                style={{ animationDelay: '0.3s' }}
              >
                <Link to="/register">
                  <button
                    className="w-full sm:w-auto h-16 text-xl font-black px-12 rounded-2xl
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={coralBtn}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    무료로 기록 시작하기
                  </button>
                </Link>
                <Link to="/login">
                  <button
                    className="w-full sm:w-auto h-16 text-xl font-black px-12 rounded-2xl
                               bg-white border-2 transition-colors
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      borderColor: main,
                      ...coralColor,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = mainA(0.06) }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
                  >
                    로그인하기
                  </button>
                </Link>
              </div>

              <p
                className="text-sm text-foreground/50 font-medium animate-fade-up"
                style={{ animationDelay: '0.35s' }}
              >
                가입비 없음 · 1분이면 충분해요
              </p>
            </div>

            {/* 우측 플로팅 카드 (데스크톱 only) */}
            <div
              className="hidden md:block w-80 shrink-0 lp-float"
              style={{ transform: 'rotate(2deg)' }}
            >
              <FloatingPreviewCard card={PREVIEW_CARDS[0]} main={main} dark={dark} light={light} />
            </div>
          </div>

          {/* 카테고리 뱃지 행 */}
          <div className="max-w-6xl mx-auto mt-16 relative">
            <div
              role="list"
              aria-label="기록할 수 있는 활동 종류"
              className="flex flex-wrap justify-center md:justify-start gap-3"
            >
              {CATEGORY_BADGES.map(({ label, icon: Icon }, index) => (
                <div
                  key={label}
                  role="listitem"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full lp-badge-in text-base font-bold shadow-sm bg-white"
                  style={{
                    animationDelay: `${0.4 + index * 0.05}s`,
                    border: `1px solid ${mainA(0.2)}`,
                    ...coralColor,
                  }}
                >
                  <Icon size={18} aria-hidden="true" style={coralColor} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 활동 피드 미리보기 섹션 ────────────────────────────────────── */}
        <section
          aria-labelledby="feed-preview-heading"
          className="px-6 py-20"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 100% 50%, ${mainA(0.10)} 0%, transparent 60%), ${mainA(0.06)}`,
          }}
        >
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2
                id="feed-preview-heading"
                className="text-3xl md:text-4xl font-black text-foreground"
                style={serifStyle}
              >
                지금도 누군가 기록하고 있어요
              </h2>
              <p className="text-lg text-foreground/60 font-medium leading-relaxed">
                오늘 한강 산책한 이웃, 직접 김치찌개 끓인 이웃 — 나도 합류해 보세요.
              </p>
            </div>

            <div
              role="list"
              aria-label="활동 기록 미리보기"
              className="grid md:grid-cols-3 gap-6"
            >
              {PREVIEW_CARDS.map((card, index) => {
                const CategoryIcon = card.categoryIcon
                return (
                  <article
                    key={card.id}
                    role="listitem"
                    aria-label={`${card.nickname}님의 ${card.categoryLabel} 활동`}
                    className="rounded-2xl bg-white overflow-hidden lp-card-hover animate-fade-up"
                    style={{
                      animationDelay: `${0.1 + index * 0.15}s`,
                      boxShadow: '0 4px 20px oklch(0 0 0 / 0.08)',
                      marginTop: index === 0 ? '-8px' : undefined,
                    }}
                  >
                    <div className="px-5 pt-5 pb-4 space-y-2">
                      <div className="flex items-center gap-3 mb-1">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `linear-gradient(135deg, ${mainA(0.2)}, ${lightA(0.2)})` }}
                          aria-hidden="true"
                        >
                          <span className="text-base font-black" style={coralColor}>
                            {card.initial}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-base font-bold text-foreground">{card.nickname}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-foreground/60 font-medium">{card.timeLabel}</span>
                            <CategoryIcon size={14} aria-hidden="true" style={coralColor} />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-foreground leading-snug">{card.title}</h3>
                      <p className="text-base text-foreground/70 leading-relaxed line-clamp-3">{card.description}</p>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-5">
                      {[
                        { Icon: Heart,         count: card.likeCount,    label: `좋아요 ${card.likeCount}개` },
                        { Icon: MessageCircle, count: card.commentCount, label: `댓글 ${card.commentCount}개` },
                        { Icon: Eye,           count: card.viewCount,    label: `조회 ${card.viewCount}회` },
                      ].map(({ Icon, count, label }) => (
                        <div
                          key={label}
                          className="flex items-center gap-1.5"
                          style={coralColor}
                          aria-label={label}
                        >
                          <Icon size={20} aria-hidden="true" />
                          <span className="text-base font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── 특징 소개 섹션 ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="features-heading"
          className="relative px-6 py-20 bg-white"
        >
          {/* 상단 웨이브 구분선 */}
          <div className="absolute -top-1 left-0 right-0 overflow-hidden h-12 pointer-events-none" aria-hidden="true">
            <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-full">
              <path
                d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z"
                fill={mainA(0.06)}
              />
            </svg>
          </div>

          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2
                id="features-heading"
                className="text-3xl md:text-4xl font-black text-foreground"
                style={serifStyle}
              >
                이런 점이 좋아요
              </h2>
              <div
                className="w-16 h-1.5 rounded-full mx-auto"
                style={{ background: gradientBg }}
                aria-hidden="true"
              />
              <p className="text-lg text-foreground/60 font-medium leading-relaxed">
                복잡하지 않아요. 누구나 쉽게 시작할 수 있어요.
              </p>
            </div>

            <div
              role="list"
              aria-label="서비스 주요 특징"
              className="grid md:grid-cols-3 gap-6"
            >
              {FEATURES.map(({ icon: Icon, title, description }, index) => (
                <div
                  key={title}
                  role="listitem"
                  className="relative rounded-2xl bg-white border border-gray-100
                             px-7 py-8 space-y-4 lp-card-hover animate-fade-up overflow-hidden"
                  style={{
                    animationDelay: `${0.1 + index * 0.15}s`,
                    boxShadow: '0 4px 20px oklch(0 0 0 / 0.06)',
                  }}
                >
                  <span
                    className="absolute top-4 right-5 text-6xl font-black select-none pointer-events-none"
                    style={{ ...serifStyle, color: mainA(0.10), lineHeight: 1 }}
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={featureIconBg}
                    aria-hidden="true"
                  >
                    <Icon size={28} style={coralColor} />
                  </div>
                  <h3 className="text-xl font-black text-foreground">{title}</h3>
                  <p className="text-lg text-foreground/70 leading-relaxed font-medium">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 가족 연결 섹션 ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="family-heading"
          className="relative px-6 py-20 overflow-hidden"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 0% 50%, ${mainA(0.10)} 0%, transparent 60%), ${mainA(0.04)}`,
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-14">

            {/* 좌측 텍스트 */}
            <div className="flex-1 space-y-8 text-center md:text-left">

              <p
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold"
                style={badgeCoral}
              >
                <Home size={18} aria-hidden="true" />
                가족 전용 기능
              </p>

              <h2
                id="family-heading"
                className="text-3xl md:text-4xl font-black text-foreground leading-snug"
                style={{ ...serifStyle, wordBreak: 'keep-all' }}
              >
                자녀가 오늘{' '}
                <span style={gradientText}>부모님 안부</span>를 확인해요
              </h2>

              <p
                className="text-lg text-foreground/70 leading-relaxed font-medium"
                style={{ wordBreak: 'keep-all' }}
              >
                "산책했어요" 한 줄이 자녀에게는 오늘의 안부예요.
                카카오톡 초대 링크 하나로 가족만 볼 수 있는 공간을 만들어요.
              </p>

              <ul className="space-y-4" aria-label="가족 기능 특징">
                {FAMILY_POINTS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={featureIconBg}
                      aria-hidden="true"
                    >
                      <Icon size={20} style={coralColor} />
                    </div>
                    <span
                      className="text-lg text-foreground/80 font-medium leading-snug"
                      style={{ wordBreak: 'keep-all' }}
                    >
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/register">
                <button
                  className="h-16 text-xl font-black px-12 rounded-2xl
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={coralBtn}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  가족 그룹 만들기
                </button>
              </Link>
            </div>

            {/* 우측 가족 피드 미리보기 카드 (데스크톱 only) */}
            <div
              className="hidden md:flex flex-col gap-4 w-80 shrink-0 lp-float"
              style={{ transform: 'rotate(-2deg)' }}
              aria-hidden="true"
            >
              {/* 간편 기록 카드 */}
              <div
                className="rounded-2xl bg-white px-5 py-4"
                style={{ boxShadow: `0 16px 48px ${mainA(0.18)}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${mainA(0.2)}, ${lightA(0.2)})` }}
                  >
                    <span className="text-sm font-black" style={coralColor}>홍</span>
                  </div>
                  <div>
                    <span className="text-base font-bold text-foreground">홍길동</span>
                    <p className="text-sm text-foreground/60 font-medium">오늘 오전 8:15</p>
                  </div>
                  <div
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                    style={badgeCoral}
                  >
                    <Footprints size={14} aria-hidden="true" />
                    산책했어요
                  </div>
                </div>
              </div>
              {/* 상세 기록 카드 */}
              <div
                className="rounded-2xl bg-white overflow-hidden"
                style={{ boxShadow: `0 8px 32px ${mainA(0.12)}` }}
              >
                <div className="px-5 pt-5 pb-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(135deg, ${mainA(0.2)}, ${lightA(0.2)})` }}
                    >
                      <span className="text-sm font-black" style={coralColor}>홍</span>
                    </div>
                    <div>
                      <span className="text-base font-bold text-foreground">홍길동</span>
                      <p className="text-sm text-foreground/60 font-medium">오늘 오후 2:30</p>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-foreground">도서관에서 책 한 권 읽었어요</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">
                    오늘 오후에 동네 도서관에 갔다가 소설 한 권을 앉은 자리에서 다 읽었어요.
                  </p>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-1.5" style={coralColor}>
                  <Heart size={16} aria-hidden="true" />
                  <span className="text-sm font-semibold">아빠 잘하셨어요!</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 하단 CTA 배너 ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          className="relative px-6 py-20 overflow-hidden"
          style={ctaBg}
        >
          <div
            className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full pointer-events-none lp-orb-pulse"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)' }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-[-60px] left-[-20px] w-64 h-64 rounded-full pointer-events-none lp-orb-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)',
              animationDelay: '2s',
            }}
            aria-hidden="true"
          />

          <div
            className="max-w-2xl mx-auto text-center space-y-8 relative animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="space-y-4">
              <h2
                id="cta-heading"
                className="text-3xl md:text-4xl font-black text-white leading-snug"
                style={serifStyle}
              >
                오늘의 나를 기록해 보세요
              </h2>
              <p className="text-xl text-white/80 leading-relaxed font-medium">
                무료 · 1분 가입 · 언제든 그만해도 괜찮아요
              </p>
            </div>
            <Link to="/register">
              <button
                className="h-16 text-xl font-black px-14 rounded-2xl bg-white
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-white focus-visible:ring-offset-2 transition-colors"
                style={coralColor}
                onMouseEnter={e => { e.currentTarget.style.background = mainA(0.08) }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
              >
                무료로 기록 시작하기
              </button>
            </Link>
          </div>
        </section>

      </main>

      {/* ── 푸터 ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white px-6 py-8 text-center space-y-1">
        <p className="text-base font-black inline-block" style={{ ...serifStyle, ...gradientText }}>
          오늘 뭐 했어요?
        </p>
        <p className="text-base text-foreground/60 font-medium">
          © 2025 오늘 뭐 했어요? · 중장년 일상 기록 커뮤니티
        </p>
      </footer>

    </div>
  )
}
