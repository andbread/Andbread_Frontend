import React from 'react'
import Modal from './Modal'

interface PermissionDeniedModalProps {
  isOpen: boolean
  onClose: () => void
}

const PermissionDeniedModal = ({
  isOpen,
  onClose,
}: PermissionDeniedModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center p-8">
        <div className="mb-12 flex w-full flex-col gap-8 pl-4">
          <div className="mb-4 text-heading04 text-gray-800">
            OS 알림 권한을 허용해주세요.
          </div>
          <div className="whitespace-pre-line text-body02 leading-5 text-gray-600">
            {`엔빵 알림을 설정하기 전에,\n먼저 OS 알림 권한을 허용해주세요.`}
          </div>
          <div className="whitespace-pre-line text-body02 leading-5 text-gray-600">
            {`OS 알림 권한 설정 방법을 확인하시겠어요?`}
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-row gap-8">
        <button
          onClick={onClose}
          className="btn btn-small btn-secondary text-heading06"
        >
          취소하기
        </button>
        <button
          onClick={() => {}}
          className="btn btn-small btn-primary text-heading06"
        >
          확인하러 가기
        </button>
      </div>
    </Modal>
  )
}

export default PermissionDeniedModal
