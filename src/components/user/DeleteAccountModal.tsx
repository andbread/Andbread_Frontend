import Modal from '../common/Modal/Modal'
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
        <h2 className="mb-10 text-heading05 font-semibold text-gray-800">
          정말 회원탈퇴를 하시겠습니까?
        </h2>
        <p className="mb-30 text-body02 text-gray-600">
          회원탈퇴를 진행하면, 회원정보가 삭제됩니다.
        </p>
        <div className="flex flex-row gap-10">
          <button
            onClick={onClose}
            className="btn-small text-heading06 rounded-md bg-gray-300 text-gray-800"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="btn-small text-heading06 rounded-md bg-red-500 text-white"
          >
            탈퇴하기
          </button>
        </div>
      </div>
    </Modal>
  )
}
export default DeleteAccountModal
