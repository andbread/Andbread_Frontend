import TermsAgreementPageClient from '@/components/auth/TermsAgreementPageClient'
import { getSafeRedirectPath } from '@/lib/authRedirect'

interface TermsAgreementPageProps {
  searchParams: Promise<{ next?: string | string[] }>
}

const TermsAgreementPage = async ({
  searchParams,
}: TermsAgreementPageProps) => {
  const { next } = await searchParams
  const nextPath = getSafeRedirectPath(typeof next === 'string' ? next : null)

  // 신규 로그인 사용자의 약관 동의 이후에도 기존 복귀 경로 유지
  return <TermsAgreementPageClient next={nextPath} />
}

export default TermsAgreementPage
