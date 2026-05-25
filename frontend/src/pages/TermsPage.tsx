import { Link } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'
const warmBlueDark = 'oklch(0.48 0.15 220)' as const

export default function TermsPage() {
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
            서비스 이용약관
          </h1>
          <p className="text-base text-foreground/60">최종 수정일: 2025년 5월 25일</p>
        </div>

        <div className="space-y-6 text-base text-foreground/80 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제1조 (목적)
            </h2>
            <p>
              이 약관은 "오늘 뭐 했어요?" (이하 "서비스")가 제공하는 일상 활동 기록 및 소셜 연결 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제2조 (이용 자격)
            </h2>
            <p>
              서비스는 <span className="font-semibold">만 50세 이상</span>의 개인을 대상으로 합니다. 회원가입 시 입력하는 생년월일은 정확한 정보여야 하며, 허위 정보 입력 시 본 약관 제6조에 따라 이용이 제한될 수 있습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제3조 (회원 가입 및 계정 관리)
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 가입은 이메일 인증을 통해 완료됩니다.</li>
              <li>하나의 이메일 주소로 하나의 계정만 생성할 수 있습니다.</li>
              <li>닉네임은 2~12자의 한글, 영문, 숫자로 구성해야 하며 중복될 수 없습니다.</li>
              <li>계정 정보는 타인과 공유하거나 양도할 수 없습니다.</li>
              <li>계정 보안의 책임은 회원 본인에게 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제4조 (서비스 이용)
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원은 일상 활동을 카테고리와 설명으로 기록하고 다른 회원과 공유할 수 있습니다.</li>
              <li>다른 회원의 활동에 좋아요, 댓글, 감정 반응을 남길 수 있습니다.</li>
              <li>가족 그룹을 생성하거나 초대 코드를 통해 참여할 수 있습니다.</li>
              <li>서비스는 원활한 운영을 위해 사전 통지 없이 일시적으로 중단될 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제5조 (금지 행위)
            </h2>
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
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제6조 (이용 제한 및 계정 정지)
            </h2>
            <p>
              서비스는 회원이 본 약관을 위반하거나 다음에 해당하는 경우 사전 통지 없이 서비스 이용을 제한하거나 계정을 정지·삭제할 수 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>생년월일 등 허위 정보를 입력한 경우</li>
              <li>다른 회원으로부터 신고가 누적된 경우</li>
              <li>제5조의 금지 행위를 한 경우</li>
              <li>서비스의 정상적인 운영을 방해하는 경우</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제7조 (콘텐츠의 권리)
            </h2>
            <p>
              회원이 서비스에 게시한 콘텐츠(텍스트, 사진 등)의 저작권은 해당 회원에게 있습니다. 단, 서비스 운영 및 홍보 목적으로 해당 콘텐츠를 사용할 수 있으며, 회원은 이에 동의합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제8조 (면책 조항)
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스는 회원 간의 분쟁에 개입하지 않으며 이에 대한 책임을 지지 않습니다.</li>
              <li>천재지변, 서버 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>회원이 게시한 콘텐츠로 인해 발생한 문제에 대한 책임은 해당 회원에게 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제9조 (약관 변경)
            </h2>
            <p>
              서비스는 필요 시 약관을 변경할 수 있으며, 변경 시 서비스 내 공지사항을 통해 7일 전에 고지합니다. 변경된 약관에 동의하지 않는 경우 탈퇴할 수 있으며, 고지 기간 이후 계속 이용하면 변경된 약관에 동의한 것으로 간주합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              제10조 (준거법 및 관할)
            </h2>
            <p>
              이 약관은 대한민국 법률에 따르며, 분쟁 발생 시 대한민국 법원을 관할 법원으로 합니다.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            to="/register"
            className="w-full flex items-center justify-center h-14 rounded-2xl text-white text-lg font-bold
                       transition-opacity hover:opacity-90
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[oklch(0.62_0.15_220)]"
            style={{ background: warmBlueGradient }}
          >
            회원가입으로 돌아가기
          </Link>
          <p className="text-sm text-center text-foreground/50">
            <Link to="/privacy" className="underline underline-offset-4 hover:opacity-70 transition-opacity" style={{ color: warmBlueDark }}>
              개인정보 처리방침
            </Link>
            도 확인해 보세요
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
