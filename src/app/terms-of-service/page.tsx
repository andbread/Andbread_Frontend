import DetailHeader from '@/components/common/header/DetailHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '서비스이용약관',
}

const sectionTitleClass = 'text-heading04 text-gray-800 mt-16'
const bodyClass = 'mt-8 whitespace-pre-line text-paragraph text-gray-700'

export default function TermsOfServicePage() {
  return (
    <main className="min-h-dvh bg-background px-24 pb-40 pt-24">
      <DetailHeader />
      <article className="mx-auto mt-20 max-w-[600px]">
        <h1 className="text-gray-800">엔빵 서비스 이용약관</h1>
        <p className="mt-12 text-body03 text-gray-500">
          시행일: 2026년 5월 22일 | 최종 수정일: 2026년 5월 22일
        </p>

        <section className="mt-32">
          <h2 className={sectionTitleClass}>제1조 (목적)</h2>
          <p className={bodyClass}>
            본 약관은 엔빵 팀(이하 &quot;서비스 제공자&quot;)이 제공하는 구독
            공유 관리 서비스 엔빵(N빵)의 이용 조건과 절차, 권리·의무 및 책임
            사항을 규정합니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제2조 (용어의 정의)</h2>
          <p className={bodyClass}>
            서비스: 엔빵이 제공하는 구독 공유 관리 기능 일체
            {'\n'}이용자: 약관에 동의하고 서비스를 이용하는 회원
            {'\n'}엔빵(N빵): 이용자가 등록한 구독 공유 그룹
            {'\n'}방장: 엔빵 생성 및 관리 권한 보유 이용자
            {'\n'}소셜 로그인: 구글/카카오 계정 기반 로그인 방식
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제3조 (약관의 게시와 개정)</h2>
          <p className={bodyClass}>
            서비스 제공자는 약관을 서비스 내에 게시하고, 관련 법령 범위 내에서
            개정할 수 있습니다. 개정 시 적용일 및 내용을 7일 전(불리한 변경은
            30일 전)부터 공지합니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제4조 (이용 계약의 성립)</h2>
          <p className={bodyClass}>
            이용자는 소셜 로그인으로 최초 로그인 시 약관 및 개인정보처리방침에
            동의함으로써 이용 계약이 성립합니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제5조 (서비스의 제공)</h2>
          <p className={bodyClass}>
            제공 기능: 엔빵 생성/관리, 링크 초대, 납부 현황 확인, 캘린더, 소셜
            로그인. 서비스는 연중무휴 제공을 원칙으로 하나 점검/장애 등으로 일시
            중단될 수 있습니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제6조 (이용자의 의무)</h2>
          <p className={bodyClass}>
            이용자는 타인 계정 도용, 운영 방해, 불법 행위, 무단 수집/제공, 무단
            복제/배포 등 금지 행위를 해서는 안 됩니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제7조 (서비스 제공자의 의무)</h2>
          <p className={bodyClass}>
            서비스 제공자는 관련 법령과 약관을 준수하고, 안정적 서비스 제공 및
            개인정보 보호, 이용자 민원의 신속 처리를 위해 노력합니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제8조 (개인정보의 수집 및 이용)</h2>
          <p className={bodyClass}>
            수집 항목: 이름(닉네임), 이메일, 프로필 이미지
            {'\n'}수집 목적: 회원 식별, 참여자 표시, 초대 링크 처리, 서비스 운영
            {'\n'}보유 기간: 회원 탈퇴 시까지(법령상 보존 의무 기간 제외)
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제9조 (제3자 서비스 연동)</h2>
          <p className={bodyClass}>
            구글/카카오 소셜 로그인 및 Google Analytics를 연동하며, 외부 서비스
            정책 변경 또는 중단에 따른 불편에 대해 서비스 제공자는 책임을 지지
            않습니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제10조 (지식재산권)</h2>
          <p className={bodyClass}>
            서비스 내 소프트웨어/디자인/텍스트 등 지식재산권은 서비스 제공자에게
            귀속됩니다. 이용자는 사전 동의 없이 복제·배포·전송 등으로 이용할 수
            없습니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>
            제11조 (서비스 이용 제한 및 중단)
          </h2>
          <p className={bodyClass}>
            약관 위반 또는 불가항력 사유가 있는 경우 서비스 이용 제한, 중단 또는
            종료가 가능합니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>
            제12조 (이용 계약의 해지 및 탈퇴)
          </h2>
          <p className={bodyClass}>
            이용자는 마이페이지에서 언제든 탈퇴할 수 있으며, 탈퇴 시 계정 및
            연관 데이터는 즉시 삭제됩니다. 탈퇴 후 데이터 복구는 불가합니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제13조 (책임 제한)</h2>
          <p className={bodyClass}>
            서비스 제공자는 무료 서비스 이용에 따른 손해, 이용자 간 분쟁, 이용자
            귀책 사유로 인한 장애 등에 대해 법령상 특별 규정이 없는 한 책임을
            지지 않습니다.
          </p>
        </section>

        <section className="mt-28">
          <h2 className={sectionTitleClass}>제14조 (준거법 및 재판 관할)</h2>
          <p className={bodyClass}>
            본 약관은 대한민국 법률에 따라 해석되며, 분쟁은 대한민국
            민사소송법상 관할 법원에서 해결합니다.
          </p>
        </section>

        <p className="mt-32 text-body03 text-gray-500">
          부칙: 본 약관은 2026년 5월 22일부터 시행합니다.
        </p>
      </article>
    </main>
  )
}
