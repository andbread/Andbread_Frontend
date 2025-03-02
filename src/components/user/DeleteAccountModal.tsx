import Modal from '../common/modal/Modal'
interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}
const DeleteAccountModal = ({
  isOpen,
  onClose,
  onSubmit,
}: DeleteAccountModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col p-8">
        <div className="flex flex-col pl-4">
          <h2 className="mb-10 text-heading05 font-semibold text-gray-800">
            정말 탈퇴하시겠어요?
          </h2>
          <p className="mb-30 text-body02 text-gray-600">
            탈퇴 시 회원정보 및 엔빵 정보가 모두 삭제됩니다.
          </p>
        </div>
        <div className="flex flex-row gap-10">
          <button
            onClick={onClose}
            className="btn btn-small btn-secondary text-heading06"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="btn btn-small btn-warning text-heading06"
          >
            탈퇴하기
          </button>
        </div>
      </div>
    </Modal>
  )
}
export default DeleteAccountModal
