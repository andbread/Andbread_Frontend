'use client'
import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'

interface NotificationPermissionModalProps {
  userId: string | undefined
  onClose: () => void
}

const NotificationPermissionModal = ({
  userId,
  onClose,
}: NotificationPermissionModalProps) => {
  const {
    permissionState,
    showIOSPermissionModal,
    getPermissionAndRegisterToken,
  } = useNotificationPermission(userId)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleCloseButtonPress = () => {
    setIsOpen(false)
    onClose
  }

  useEffect(() => {
    if (!userId || !permissionState) return
    setIsOpen(showIOSPermissionModal)
  }, [userId, permissionState, showIOSPermissionModal])

  if (!userId) return null

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <div className="flex flex-col items-center p-8">
        <div className="mb-24 flex w-full flex-col gap-8 pl-4">
          <div className="text-heading04 text-gray-800">
            알림 권한을 허용해주세요.
          </div>
          <div className="whitespace-pre-line text-body02 leading-5 text-gray-600">
            {`원활한 서비스 사용을 위해\n알림 권한이 필요해요.`}
          </div>
        </div>
        <div className="flex flex-row gap-8">
          <button
            onClick={() => handleCloseButtonPress()}
            className="btn btn-small btn-secondary text-heading06"
          >
            거절하기
          </button>
          <button
            onClick={() => getPermissionAndRegisterToken()}
            className="btn btn-small btn-primary text-heading06"
          >
            허용하기
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default NotificationPermissionModal
