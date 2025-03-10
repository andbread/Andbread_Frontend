import Modal from '@/components/common/modal/Modal'

interface NbreadDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

const NbreadDeleteModal = ({
  isOpen,
  onClose,
  onSubmit,
}: NbreadDeleteModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-start p-8">
        <div className="mb-32 flex flex-col gap-8 pl-8">
          <div className="text-heading04 text-gray-800">
            정말 엔빵을 삭제하시겠어요?
          </div>
          <div className="text-body02 text-gray-800">
            삭제된 엔빵 정보는 복구되지 않아요.
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
            삭제하기
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default NbreadDeleteModal
