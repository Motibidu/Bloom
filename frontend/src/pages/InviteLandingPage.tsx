import { useParams, useNavigate } from 'react-router-dom'
import { Users, Heart, MessageCircle, Eye, Footprints, ChefHat, BookOpen, Dumbbell, PlusCircle } from 'lucide-react'
import { useFamilyPreview, useJoinFamily } from '@/hooks/useFamily'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const serifStyle: React.CSSProperties = { fontFamily: "'Noto Serif KR', serif" }

// ── 더미 피드 데이터 ───────────────────────────────────────────────────────────
const DUMMY_CARDS = [
  {
    avatar: '김',
    nickname: '김영숙',
    category: '산책',
    CategoryIcon: Footprints,
    title: '오늘 한강 공원 다녀왔어요',
    desc: '날씨가 너무 좋아서 아침 일찍 나갔다 왔어요. 벚꽃이 아직 조금 남아 있더라고요 🌸',
    time: '오전 9:23',
    likes: 5,
    comments: 3,
    views: 12,
    emoji: '🌸',
  },
  {
    avatar: '박',
    nickname: '박민준',
    category: '요리',
    CategoryIcon: ChefHat,
    title: '된장찌개 끓였어요',
    desc: '오늘 점심은 직접 끓인 된장찌개! 두부랑 호박 넣었더니 맛있게 됐어요 😊',
    time: '오후 12:41',
    likes: 8,
    comments: 2,
    views: 19,
    emoji: '🍲',
  },
  {
    avatar: '이',
    nickname: '이순자',
    category: '독서',
    CategoryIcon: BookOpen,
    title: '채식주의자 읽는 중이에요',
    desc: '한강 작가 소설 처음 읽어보는데 생각보다 무겁네요. 그래도 손에서 놓기가 어려워요.',
    time: '오후 3:15',
    likes: 4,
    comments: 1,
    views: 8,
    emoji: '📚',
  },
  {
    avatar: '최',
    nickname: '최정호',
    category: '운동',
    CategoryIcon: Dumbbell,
    title: '헬스장 1시간 다녀왔어요',
    desc: '요즘 꾸준히 나가고 있어요. 3개월 됐는데 확실히 몸이 가벼워진 느낌 💪',
    time: '오후 6:02',
    likes: 11,
    comments: 4,
    views: 23,
    emoji: '💪',
  },
]

type DummyCard = typeof DUMMY_CARDS[0]

// ── 실제처럼 보이는 더미 카드 (블러 처리) ────────────────────────────────────
function BlurredFeedCard({ card, blur }: { card: DummyCard; blur: boolean }) {
  return (
    <article
      className="rounded-2xl bg-white overflow-hidden flex flex-col select-none"
      style={{
        boxShadow: `0 2px 16px ${mA(0.08)}`,
        filter: blur ? 'blur(5px)' : 'none',
        opacity: blur ? 0.6 : 1,
        transition: 'filter 0.3s',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* 헤더 */}
      <div className="pl-5 pr-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-lg font-black"
            style={{ background: grad, color: 'white' }}
          >
            {card.avatar}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-foreground leading-none">{card.nickname}</span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold"
                style={{ background: mA(0.10), border: `1px solid ${mA(0.22)}`, color: dark }}
              >
                <card.CategoryIcon size={13} />
                {card.category}
              </span>
            </div>
            <span className="text-sm text-foreground/50 font-medium">{card.time}</span>
          </div>
        </div>
      </div>

      <hr className="mx-6 border-none h-px" style={{ background: mA(0.18) }} />

      {/* 본문 */}
      <div className="pl-7 pr-5 pt-4 pb-4">
        <h3 className="text-xl font-black text-foreground mb-2 leading-snug">{card.title}</h3>
        <p className="text-base text-foreground/75 leading-relaxed line-clamp-2">{card.desc}</p>
      </div>

      {/* 이모지 배너 */}
      <div className="px-5 pb-4">
        <div
          className="w-full h-28 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${mA(0.07)}, ${mA(0.04)})` }}
        >
          <span className="text-6xl" role="img">{card.emoji}</span>
        </div>
      </div>

      {/* 하단 반응 바 */}
      <div
        className="px-5 py-1 flex items-center gap-4"
        style={{ borderTop: `1px solid ${mA(0.10)}` }}
      >
        <div className="flex items-center gap-1 min-h-[44px]" style={{ color: 'oklch(0.55 0.18 25)' }}>
          <Heart size={18} />
          <span className="text-sm font-bold">{card.likes}</span>
        </div>
        <div className="flex items-center gap-1 min-h-[44px]" style={{ color: 'oklch(0.55 0.05 220)' }}>
          <MessageCircle size={18} />
          <span className="text-sm font-bold">{card.comments}</span>
        </div>
        <div className="flex items-center gap-1 min-h-[44px]" style={{ color: 'oklch(0.55 0.05 220)' }}>
          <PlusCircle size={18} />
          <span className="text-sm font-bold">나도 했어요</span>
        </div>
        <div className="flex items-center gap-1 min-h-[44px] ml-auto" style={{ color: 'oklch(0.65 0.03 220)' }}>
          <Eye size={18} />
          <span className="text-sm font-bold">{card.views}</span>
        </div>
      </div>
    </article>
  )
}

// ── 멤버 아바타 ────────────────────────────────────────────────────────────────
function MemberAvatars({ nicknames }: { nicknames: string[] }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {nicknames.slice(0, 4).map((name, i) => (
        <div
          key={i}
          className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black border-2 border-white"
          style={{
            background: grad,
            color: 'white',
            marginLeft: i > 0 ? '-8px' : '0',
            zIndex: nicknames.length - i,
            position: 'relative',
          }}
          aria-label={name}
        >
          {name[0]}
        </div>
      ))}
      {nicknames.length > 4 && (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 border-white"
          style={{ background: mA(0.12), color: dark, marginLeft: '-8px', position: 'relative', zIndex: 0 }}
          aria-label={`외 ${nicknames.length - 4}명`}
        >
          +{nicknames.length - 4}
        </div>
      )}
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export default function InviteLandingPage() {
  const { inviteCode = '' } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const joinFamily = useJoinFamily()

  const { data: preview, isLoading, isError } = useFamilyPreview(inviteCode)

  const handleJoinNow = async () => {
    try {
      await joinFamily.mutateAsync({ inviteCode })
      toast.success('가족 그룹에 참여했어요!')
      navigate('/family')
    } catch {
      toast.error('이미 참여 중이거나 유효하지 않은 초대 코드예요.')
      navigate('/family')
    }
  }

  const handleGoRegister = () => {
    sessionStorage.setItem('pendingInviteCode', inviteCode)
    navigate(`/register?inviteCode=${inviteCode}`)
  }

  const handleGoLogin = () => {
    sessionStorage.setItem('pendingInviteCode', inviteCode)
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: mA(0.04) }}>
        <div
          className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${mA(0.25)} ${mA(0.25)} ${mA(0.25)} transparent` }}
          role="status"
          aria-label="불러오는 중"
        />
      </div>
    )
  }

  if (isError || !preview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center" style={{ background: mA(0.04) }}>
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: mA(0.10) }}
          aria-hidden="true"
        >
          <span className="text-4xl">😔</span>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-black text-foreground" style={serifStyle}>유효하지 않은 초대예요</p>
          <p className="text-base font-medium text-foreground/60 leading-relaxed">
            초대 링크가 만료되었거나 잘못된 코드예요.<br />
            초대한 분께 새 링크를 요청해 주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(180deg, ${mA(0.08)} 0%, white 40%)` }}
    >
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-12 pb-8 gap-8">

        {/* 서비스 로고 */}
        <div className="text-center">
          <span
            className="text-xl font-black"
            style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            오늘 뭐 했어요?
          </span>
        </div>

        {/* 초대 메시지 카드 */}
        <div
          className="rounded-3xl p-6 text-center flex flex-col items-center gap-4"
          style={{ background: 'white', boxShadow: `0 8px 40px ${mA(0.14)}`, border: `1px solid ${mA(0.10)}` }}
        >
          {/* 그룹 아이콘 */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${mA(0.12)}, ${mA(0.06)})` }}
            aria-hidden="true"
          >
            <Users size={30} style={{ color: main }} />
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground/60">가족 그룹 초대</p>
            <h1 className="text-2xl font-black text-foreground" style={serifStyle}>
              {preview.groupName}
            </h1>
          </div>

          {/* 멤버 아바타 */}
          <MemberAvatars nicknames={preview.memberNicknames} />
          <p className="text-sm font-semibold text-foreground/50">
            {preview.memberNicknames[0]}님 외 {preview.memberCount - 1}명이 함께하고 있어요
          </p>
        </div>

        {/* 서비스 설명 */}
        <div className="text-center space-y-2 px-2">
          <p className="text-lg font-black text-foreground" style={serifStyle}>
            가족의 일상을 함께 나눠요
          </p>
          <p className="text-base font-medium text-foreground/60 leading-relaxed">
            오늘 산책했어요, 밥 먹었어요, 책 읽었어요 —<br />
            소소한 일상을 가족과 공유하는 공간이에요.
          </p>
        </div>

        {/* 피드 미리보기 */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-center pb-1" style={{ color: mA(0.5) }}>
            참여하면 이런 화면을 볼 수 있어요
          </p>
          {/* 첫 번째 카드 — 선명하게 */}
          <BlurredFeedCard card={DUMMY_CARDS[0]} blur={false} />
          {/* 나머지 — 블러 + 페이드아웃 */}
          <div className="relative overflow-hidden" style={{ maxHeight: '320px' }}>
            <div className="flex flex-col gap-2">
              <BlurredFeedCard card={DUMMY_CARDS[1]} blur={true} />
              <BlurredFeedCard card={DUMMY_CARDS[2]} blur={true} />
            </div>
            {/* 페이드아웃 그라디언트 */}
            <div
              className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent 0%, white 75%)' }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="flex flex-col gap-3 mt-auto pt-4">
          {isAuthenticated ? (
            <button
              onClick={handleJoinNow}
              disabled={joinFamily.isPending}
              className="w-full min-h-[64px] text-xl font-black rounded-2xl text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
              style={{ background: grad, boxShadow: `0 4px 20px ${mA(0.3)}` }}
            >
              {joinFamily.isPending ? '참여 중...' : '가족 그룹 참여하기'}
            </button>
          ) : (
            <>
              <button
                onClick={handleGoRegister}
                className="w-full min-h-[64px] text-xl font-black rounded-2xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
                style={{ background: grad, boxShadow: `0 4px 20px ${mA(0.3)}` }}
              >
                가입하고 참여하기
              </button>
              <button
                onClick={handleGoLogin}
                className="w-full min-h-[56px] text-lg font-bold rounded-2xl border-2 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
                style={{ borderColor: main, color: dark }}
              >
                이미 계정이 있어요
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
