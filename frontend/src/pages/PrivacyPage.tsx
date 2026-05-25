import { Link } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'

const warmBlueGradient = 'linear-gradient(135deg, oklch(0.62 0.15 220), oklch(0.76 0.12 220))'
const warmBlueDark = 'oklch(0.48 0.15 220)' as const

export default function PrivacyPage() {
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
            개인정보 처리방침
          </h1>
          <p className="text-base text-foreground/60">최종 수정일: 2025년 5월 25일</p>
        </div>

        <div className="space-y-6 text-base text-foreground/80 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              1. 개인정보의 수집 및 이용 목적
            </h2>
            <p>
              "오늘 뭐 했어요?" (이하 "서비스")는 다음의 목적으로 개인정보를 수집·이용합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 가입 및 본인 확인</li>
              <li>서비스 제공 및 운영 (활동 기록, 소셜 연결 기능)</li>
              <li>이메일 인증을 통한 계정 보안</li>
              <li>서비스 이용 내역 관리 및 고객 지원</li>
              <li>서비스 개선을 위한 이용 분석</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              2. 수집하는 개인정보 항목
            </h2>
            <p><span className="font-semibold">필수 항목</span>: 이메일 주소, 비밀번호, 닉네임, 생년월일</p>
            <p><span className="font-semibold">선택 항목</span>: 이름, 자기소개, 프로필 사진</p>
            <p><span className="font-semibold">자동 수집</span>: 서비스 이용 기록, 접속 로그, IP 주소</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <p>
              회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 별도 보관합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>전자상거래 관련 기록: 5년 (전자상거래법)</li>
              <li>소비자 불만 및 분쟁 처리 기록: 3년 (전자상거래법)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              4. 개인정보의 제3자 제공
            </h2>
            <p>
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 이용자의 사전 동의가 있거나 법령에 의한 경우에는 예외로 합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              5. 개인정보 처리의 위탁
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Amazon Web Services (AWS): 서버 및 데이터 저장소 운영</li>
              <li>Google (Firebase): 푸시 알림 서비스 운영</li>
              <li>Google: 이메일 발송 (Gmail SMTP)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              6. 이용자의 권리
            </h2>
            <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 처리 현황 조회 및 열람 요청</li>
              <li>개인정보 수정 및 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>회원 탈퇴 (서비스 내 프로필 설정에서 가능)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              7. 개인정보 보호책임자
            </h2>
            <p>
              개인정보 관련 문의사항은 아래로 연락해 주세요.
            </p>
            <p className="font-medium">이메일: jack981109@gmail.com</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              8. 개인정보 처리방침 변경
            </h2>
            <p>
              이 개인정보 처리방침은 법령·정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시 변경 사유 및 내용을 서비스 내 공지사항을 통해 고지합니다.
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
            <Link to="/terms" className="underline underline-offset-4 hover:opacity-70 transition-opacity" style={{ color: warmBlueDark }}>
              서비스 이용약관
            </Link>
            도 확인해 보세요
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
