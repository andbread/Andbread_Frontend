import React from 'react'
import Modal from './Modal'

interface NotificationDeniedModalProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationDeniedModal = ({
  isOpen,
  onClose,
}: NotificationDeniedModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center p-8">
        <div className="mb-12 flex w-full flex-col gap-8 pl-4">
          <div className="mb-12 text-heading04 text-gray-800">
            알림 권한을 거부했어요.
          </div>
          <div className="whitespace-pre-line text-body02 leading-5 text-gray-600">
            {`알림 권한을 거부하면\n엔빵에서 보내는 알림을 받을 수 없어요.`}
          </div>
          <div className="whitespace-pre-line text-body02 leading-5 text-gray-600">
            {`알림 권한을 허용하고 싶은 경우\n내 정보 > 알림 허용 토글을 클릭해\n다시 설정할 수 있어요.`}
          </div>
        </div>
      </div>
      <button onClick={onClose} className="btn btn-primary btn-medium m-12">
        알겠어요
      </button>
    </Modal>
  )
}

export default NotificationDeniedModal
