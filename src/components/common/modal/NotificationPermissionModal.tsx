'use client'
import Modal from './Modal'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { useToast } from '@/components/common/toast/Toast'
import IOSGuideModal from './IOSGuideModal'

interface NotificationPermissionModalProps {
  userId: string | undefined
  handlePermissionDenied: () => void
}

const NotificationPermissionModal = ({
  userId,
  handlePermissionDenied,
}: NotificationPermissionModalProps) => {
  const {
    showIOSPermissionModal,
    setShowIOSPermissionModal,
    showIOSGuideModal,
    setShowIOSGuideModal,
    shouldShowIOSGuide,
    requestPermission,
  } = useNotificationPermission(userId)

  const handleConfirmButtonPress = async () => {
    setShowIOSPermissionModal(false)
    const permission = await requestPermission()

    if (permission === 'unsupported' && shouldShowIOSGuide) {
      return
    }

    if (permission !== 'granted') {
      handlePermissionDenied()
      return
    }

    useToast.success('알림이 허용되었어요.')
  }

  const handleCloseButtonPress = () => {
    setShowIOSPermissionModal(false)
    handlePermissionDenied()
  }

  if (!userId) return null

  return (
    <>
      <Modal
        isOpen={showIOSPermissionModal}
        onClose={() => setShowIOSPermissionModal(false)}
      >
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
              나중에 하기
            </button>
            <button
              onClick={() => handleConfirmButtonPress()}
              className="btn btn-small btn-primary text-heading06"
            >
              허용하기
            </button>
          </div>
        </div>
      </Modal>
      <IOSGuideModal
        isOpen={showIOSGuideModal}
        onClose={() => setShowIOSGuideModal(false)}
      />
    </>
  )
}

export default NotificationPermissionModal
