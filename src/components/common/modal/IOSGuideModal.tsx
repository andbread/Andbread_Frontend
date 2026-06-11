'use client'

import { useRouter } from 'next/navigation'
import Modal from './Modal'

interface IOSGuideModalProps {
  isOpen: boolean
  onClose: () => void
  guidePath?: string
}

const IOSGuideModal = ({
  isOpen,
  onClose,
  guidePath = '/ios-guide',
}: IOSGuideModalProps) => {
  const router = useRouter()

  const handleGuideButtonPress = () => {
    onClose()
    router.push(guidePath)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex w-280 flex-col px-12 pb-12 pt-4">
        <div className="mb-20 flex w-full flex-col gap-8">
          <div className="text-heading05 text-gray-800">
            알림을 받을 수 없는 환경이에요.
          </div>
          <div className="whitespace-pre-line text-paragraph font-medium text-gray-800">
            {`iOS에서 알림을 받으려면\nSafari 공유 버튼 > 홈 화면에 추가를 통해\n엔빵을 홈 화면에 추가해야 해요.\n\n더 자세한 가이드를 확인하려면\n가이드 보기 버튼을 클릭해주세요.`}
          </div>
        </div>
      </div>
      <div className="flex w-full flex-row gap-8 px-12 pb-12">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-small btn-secondary flex-1 text-heading05 text-gray-700"
        >
          취소하기
        </button>
        <button
          type="button"
          onClick={handleGuideButtonPress}
          className="btn btn-small btn-primary flex-1 text-heading05"
        >
          가이드 보기
        </button>
      </div>
    </Modal>
  )
}

export default IOSGuideModal
