'use client'

import Link from 'next/link'
import Checkbox from '@/components/common/checkbox/checkbox'

interface TermsAgreementFormProps {
  termsChecked: boolean
  privacyChecked: boolean
  isAllChecked: boolean
  isSubmitting: boolean
  onToggleAll: () => void
  onToggleTerms: () => void
  onTogglePrivacy: () => void
  onSubmit: () => void
  onLater: () => void
}

const TermsAgreementForm = ({
  termsChecked,
  privacyChecked,
  isAllChecked,
  isSubmitting,
  onToggleAll,
  onToggleTerms,
  onTogglePrivacy,
  onSubmit,
  onLater,
}: TermsAgreementFormProps) => {
  return (
    <section className="flex flex-1 flex-col px-24 pb-32 pt-24">
      <h1 className="whitespace-pre-line pb-8 text-heading01 text-gray-800">
        {`엔빵을 사용하기 위해`}
      </h1>
      <h1 className="whitespace-pre-line text-heading01 text-gray-800">
        {`약관 동의가 필요해요`}
      </h1>

      <div className="mt-64 flex flex-col gap-20">
        <div className="flex items-center gap-16 text-body01 text-gray-800">
          <Checkbox isChecked={isAllChecked} onChange={onToggleAll} />
          <button type="button" onClick={onToggleAll}>
            약관 전체 동의
          </button>
        </div>

        <div className="flex items-center gap-16 text-body01 text-gray-500">
          <Checkbox isChecked={termsChecked} onChange={onToggleTerms} />
          <Link href="/terms-of-service" className="underline">
            (필수) 서비스 이용 약관 동의
          </Link>
        </div>

        <div className="flex items-center gap-16 text-body01 text-gray-500">
          <Checkbox isChecked={privacyChecked} onChange={onTogglePrivacy} />
          <Link href="/privacy-policy" className="underline">
            (필수) 개인정보 처리방침 동의
          </Link>
        </div>
      </div>

      <div className="mt-auto flex flex-col items-center gap-22">
        <button
          type="button"
          disabled={!isAllChecked || isSubmitting}
          onClick={onSubmit}
          className={`btn btn-large ${
            isAllChecked && !isSubmitting ? 'btn-primary' : 'btn-disabled'
          }`}
        >
          확인
        </button>
        <button
          type="button"
          onClick={onLater}
          className="text-body02 text-gray-400"
        >
          나중에 하기
        </button>
      </div>
    </section>
  )
}

export default TermsAgreementForm
