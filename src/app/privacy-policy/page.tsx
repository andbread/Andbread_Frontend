import DetailHeader from '@/components/common/header/DetailHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침',
}

const sectionTitleClass = 'text-heading04 text-gray-800 mt-16'
const bodyClass = 'mt-8 whitespace-pre-line text-paragraph text-gray-700'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-background px-24 pb-40 pt-24">
      <DetailHeader />
      <article className="mx-auto mt-20 max-w-[600px]">
        <h1 className="text-gray-800">개인정보처리방침</h1>
        <p className="mt-12 text-body03 text-gray-500">
          시행일: 2026년 5월 22일 | 최종 수정일: 2025년 5월 22일
        </p>

        <p className="mt-20 text-paragraph text-gray-700">
          엔빵 팀(이하 &quot;팀&quot;)은 이용자의 개인정보를 중요하게 생각하며,
          관련 법령을 준수합니다. 본 방침은 팀이 운영하는 구독 공유 관리 서비스
          엔빵(N빵)의 개인정보 처리 기준을 설명합니다.
        </p>

        <section className="mt-32">
          <h2 className={sectionTitleClass}>
            1. 수집하는 개인정보 항목 및 수집 방법
          </h2>
          <p className={bodyClass}>
            수집 항목: 이메일 주소, 닉네임(이름), 프로필 이미지 URL(소셜 로그인
            제공 정보), 서비스 이용 중 생성되는 엔빵 정보(구독 서비스명, 금액,
            결제일, 참여 인원, 납부 현황), 접속 로그 및 이용 통계(Google
            Analytics를 통한 익명 수집).
            {'\n'}수집 방법: 구글/카카오 OAuth 소셜 로그인, 이용자 입력 데이터,
            익명 통계 자동 수집.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>2. 개인정보의 수집 및 이용 목적</h2>
          <p className={bodyClass}>
            회원 식별 및 로그인 처리, 서비스 내 이용자 표시, 엔빵 초대/참여
            연결, 서비스 개선을 위한 통계 분석, 공지 및 민원 처리에 이용합니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>3. 개인정보의 보유 및 이용 기간</h2>
          <p className={bodyClass}>
            원칙적으로 목적 달성 시 지체 없이 파기합니다.
            {'\n'}계정 및 서비스 이용 데이터: 회원 탈퇴 시까지
            {'\n'}관련 법령에 따른 보존: 접속 로그 3개월, 소비자 불만/분쟁 처리
            기록 3년
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>4. 개인정보의 제3자 제공</h2>
          <p className={bodyClass}>
            팀은 원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만 이용자
            동의가 있거나 법령에 따른 정당한 요청이 있는 경우 예외적으로 제공될
            수 있습니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>5. 개인정보 처리 위탁</h2>
          <p className={bodyClass}>
            수탁업체 및 업무:
            {'\n'}- Supabase, Inc.: 데이터베이스 저장 및 인증 처리
            {'\n'}- Google LLC: Google OAuth 2.0 인증, Google Analytics 통계
            {'\n'}- 카카오(주): Kakao OAuth 2.0 인증
            {'\n'}- Vercel, Inc.: 웹 호스팅 및 배포
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>6. 이용자의 권리와 행사 방법</h2>
          <p className={bodyClass}>
            이용자는 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.
            서비스 내 기능(마이페이지) 또는 문의 채널을 통해 행사할 수 있습니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>7. 개인정보의 파기</h2>
          <p className={bodyClass}>
            보유 기간 경과 또는 처리 목적 달성 시 복구 불가능한 방식으로
            파기합니다. 회원 탈퇴 시 계정 정보 및 연관 데이터는 즉시 삭제됩니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>
            8. 자동 수집 장치의 설치·운영 및 거부
          </h2>
          <p className={bodyClass}>
            로그인 유지 등을 위해 쿠키를 사용할 수 있으며 브라우저 설정에서
            거부할 수 있습니다. Google Analytics 익명 통계 수집을 거부하려면
            Google Analytics 차단 브라우저 부가기능을 사용할 수 있습니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>9. 개인정보의 안전성 확보 조치</h2>
          <p className={bodyClass}>
            접근 권한 최소화, 암호화 및 HTTPS 적용, Supabase Auth 기반 인증/세션
            관리, RLS(Row Level Security) 정책 등 보안 조치를 시행합니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>10. 개인정보 보호책임자 및 문의</h2>
          <p className={bodyClass}>
            서비스명: 엔빵(N빵)
            {'\n'}서비스 URL: https://nbread-nbread.vercel.app
            {'\n'}팀명: 엔빵(andbread)
            {'\n'}문의: GitHub Issues
            (https://github.com/andbread/Andbread_Frontend/issues)
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>11. 개인정보처리방침의 변경</h2>
          <p className={bodyClass}>
            법령, 정책, 보안 기술 변화에 따라 본 방침이 변경될 수 있습니다. 일반
            변경은 시행 7일 전, 이용자에게 불리한 변경은 30일 전부터 공지합니다.
          </p>
        </section>

        <p className="mt-32 text-body03 text-gray-500">
          부칙: 본 방침은 2025년 5월 22일부터 시행합니다.
        </p>
      </article>
    </main>
  )
}
