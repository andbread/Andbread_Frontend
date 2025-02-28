import Modal from '../common/Modal/Modal'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

const LogoutModal = ({ isOpen, onClose, onSubmit }: LogoutModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col p-8">
        <div className="flex flex-col pl-8">
          <h2 className="mb-10 text-heading05 font-semibold text-gray-800">
            로그아웃 하시겠어요?
          </h2>
          <p className="mb-30 text-body02 text-gray-600">
            엔빵을 이용하려면 다시 로그인해야 해요.
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
            로그아웃
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default LogoutModal
