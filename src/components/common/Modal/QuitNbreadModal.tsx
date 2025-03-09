import Modal from '@/components/common/modal/Modal'

interface QuitNbreadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

const QuitNbreadModal = ({
  isOpen,
  onClose,
  onSubmit,
}: QuitNbreadModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-start p-8">
        <div className="mb-32 flex flex-col gap-8 pl-8">
          <div className="text-heading04 text-gray-800">
            엔빵을 나가시겠어요?
          </div>
          <div className="text-body02 text-gray-800">
            엔빵 정보와 납부 기록이 모두 삭제돼요.
          </div>
        </div>
        <div className="flex flex-row gap-8">
          <button
            onClick={onClose}
            className="btn btn-small btn-secondary text-heading06"
          >
            취소하기
          </button>
          <button
            onClick={onSubmit}
            className="btn btn-small btn-warning text-heading06"
          >
            나가기
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default QuitNbreadModal
