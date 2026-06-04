import Modal from '@/components/common/modal/Modal'

interface TermsAgreementExitModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

const TermsAgreementExitModal = ({
  isOpen,
  onClose,
  onSubmit,
}: TermsAgreementExitModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col p-8">
        <div className="mb-24 flex flex-col gap-12 pl-8">
          <div className="text-heading05 text-gray-800">
            약관에 동의해주세요.
          </div>
          <div className="whitespace-pre-line text-body02 text-gray-800">
            {`약관에 동의하지 않으면\n서비스를 사용할 수 없어요.`}
          </div>
        </div>
        <div className="flex flex-row gap-8">
          <button
            onClick={onSubmit}
            className="btn h-48 flex-1 rounded-8 bg-gray-200 text-heading05 text-gray-700"
          >
            나중에 하기
          </button>
          <button
            onClick={onClose}
            className="btn h-48 flex-1 rounded-8 bg-secondary-100 text-heading05 text-white"
          >
            동의하기
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default TermsAgreementExitModal
