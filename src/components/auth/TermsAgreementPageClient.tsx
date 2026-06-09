'use client'

import DetailHeader from '@/components/common/header/DetailHeader'
import Spinner from '@/components/common/spinner/Spinner'
import TermsAgreementExitModal from '@/components/user/TermsAgreementExitModal'
import TermsAgreementForm from '@/components/user/TermsAgreementForm'
import { useTermsAgreementPage } from '@/hooks/useTermsAgreementPage'

interface TermsAgreementPageClientProps {
  next: string | null
}

const TermsAgreementPageClient = ({ next }: TermsAgreementPageClientProps) => {
  const {
    isLoading,
    isSubmitting,
    termsChecked,
    privacyChecked,
    isAllChecked,
    isExitModalOpen,
    setTermsChecked,
    setPrivacyChecked,
    setIsExitModalOpen,
    toggleAll,
    submitAgreement,
    logoutAndGoLogin,
  } = useTermsAgreementPage(next)

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="px-24 pt-16">
        <DetailHeader onClickBack={() => setIsExitModalOpen(true)} />
      </div>
      {isLoading ? (
        <Spinner isLoading={isLoading} />
      ) : (
        <TermsAgreementForm
          termsChecked={termsChecked}
          privacyChecked={privacyChecked}
          isAllChecked={isAllChecked}
          isSubmitting={isSubmitting}
          onToggleAll={toggleAll}
          onToggleTerms={() => setTermsChecked((checked) => !checked)}
          onTogglePrivacy={() => setPrivacyChecked((checked) => !checked)}
          onSubmit={submitAgreement}
          onLater={() => setIsExitModalOpen(true)}
        />
      )}
      <TermsAgreementExitModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onSubmit={logoutAndGoLogin}
      />
    </main>
  )
}

export default TermsAgreementPageClient
