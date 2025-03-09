import Modal from '@/components/common/modal/Modal'

interface DeleteParticipantModalProps {
  userName: string
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

const DeleteParticipantModal = ({
  userName,
  isOpen,
  onClose,
  onSubmit,
}: DeleteParticipantModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-start p-8">
        <div className="mb-32 flex flex-col gap-8 pl-8">
          <div className="text-heading04 text-gray-800">
            {`${userName}님을 엔빵에서 내보내시겠어요?`}
          </div>
          <div className="text-body02 text-gray-800">
            내보낸 멤버와 납부 기록이 모두 삭제돼요.
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
            내보내기
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteParticipantModal
