import Modal from './Modal'

interface LoginConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

const LoginConfirmModal = ({
  isOpen,
  onClose,
  onSubmit,
}: LoginConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center p-8">
        <div className="mb-32 flex w-full flex-col gap-8 pl-4">
          <div className="text-heading04 text-gray-800">로그인이 필요해요</div>
          <div className="whitespace-pre-line text-body02 text-gray-600">
            {`서비스를 이용하려면 로그인이 필요해요.`}
          </div>
        </div>
        <div className="flex flex-col items-center gap-8 pb-12">
          <button className="btn btn-primary btn-medium" onClick={onSubmit}>
            로그인하러 가기
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default LoginConfirmModal
