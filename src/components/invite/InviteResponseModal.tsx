import Modal from '@/components/common/modal/Modal'
import { InviteResponse } from '@/lib/invite/respondToInvite'

interface InviteResponseModalProps {
  response: InviteResponse | null
  nbreadTitle: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: () => void
}

const InviteResponseModal = ({
  response,
  nbreadTitle,
  isSubmitting,
  onClose,
  onSubmit,
}: InviteResponseModalProps) => {
  const isAccept = response === 'accepted'

  return (
    <Modal isOpen={response !== null} onClose={onClose}>
      <div className="flex flex-col gap-32 px-12 pb-8">
        <div className="flex flex-col gap-8">
          <h5>초대를 {isAccept ? '수락' : '거절'}하시겠어요?</h5>
          <p className="text-body02 text-gray-600">
            {isAccept
              ? '수락하면 즉시 참여가 완료돼요.'
              : '참여하려면 다시 초대받아야 해요.'}
          </p>
        </div>
        <div className="flex h-48 flex-row gap-8">
          <button
            className="btn w-112 bg-gray-200 text-heading05"
            disabled={isSubmitting}
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="btn w-112 bg-secondary-100 text-heading05 text-white disabled:bg-gray-300"
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? '처리 중' : isAccept ? '수락하기' : '거절하기'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default InviteResponseModal
