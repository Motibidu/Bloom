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
    title: '김치찌개 끓이기 성공!',
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
    title: '간단하게 기록해요',
    description:
      '카테고리를 고르고 한 줄만 쓰면 됩니다. 원하시면 사진도 한 장 올릴 수 있어요.',
  },
  {
    icon: Users,
    title: '이웃과 함께해요',
    description:
      '같은 활동을 한 이웃이 몇 명인지 볼 수 있어요. 자연스럽게 공감을 나눠 보세요.',
  },
  {
    icon: CalendarDays,
    title: '내 기록을 돌아봐요',
    description:
      '캘린더로 내 활동 이력을 한눈에 확인하고 꾸준히 이어가는 보람을 느껴 보세요.',
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
                오늘 하루도{' '}
                <span style={gradientText}>수고하셨어요.</span>
              </h1>

              <p
                className="text-lg sm:text-xl text-foreground/70 leading-relaxed font-medium animate-fade-up"
                style={{ animationDelay: '0.2s', wordBreak: 'keep-all' }}
              >
                나의 소소한 일상을 기록하고, 같은 활동을 한 이웃과 따뜻하게 연결되어 보세요.
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
                    지금 시작하기
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
                이런 활동들이 올라와요
              </h2>
              <p className="text-lg text-foreground/60 font-medium leading-relaxed">
                오늘 이웃들이 기록한 따뜻한 일상을 함께 나눠 보세요.
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
                오늘 하루, 기록으로 남겨 보세요
              </h2>
              <p className="text-xl text-white/80 leading-relaxed font-medium">
                가입은 무료이고 1분이면 충분해요.
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
                지금 시작하기
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
