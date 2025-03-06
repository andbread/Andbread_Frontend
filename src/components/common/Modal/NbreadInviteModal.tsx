import Modal from '@/components/common/modal/Modal'
import Icon from '../icon/Icon'

interface NbreadInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

const NbreadInviteModal = ({
  isOpen,
  onClose,
  onSubmit,
}: NbreadInviteModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center p-8">
        <div className="mb-32 flex w-full flex-col gap-8 pl-8">
          <div className="text-heading04 text-gray-800">
            친구 초대 링크가 생성되었어요.
          </div>
          <div className="whitespace-pre-line text-body02 text-gray-800">
            {`친구가 링크를 통해 접속하면\n엔빵 초대가 완료돼요.`}
          </div>
        </div>
        <div className="flex flex-col items-center gap-8 pb-12">
          <button
            onClick={onSubmit}
            className="btn btn-medium text-heading06 bg-system-blue01 hover:bg-system-blue02 active:bg-system-blue02 text-white"
          >
            <div className="flex w-full flex-row items-center justify-start px-20">
              <Icon type="copy" width={14} height={14} fill="text-white" />
              <div className="w-full">초대 링크 복사하기</div>
            </div>
          </button>
          <button
            // TODO 카카오톡 공유하기 onClick 속성 수정 필요
            onClick={onSubmit}
            className="btn btn-medium text-heading06 bg-system-kakao hover:bg-yellow-400"
          >
            <div className="flex w-full flex-row items-center justify-start px-20">
              <div className="pt-4">
                <Icon type="kakaoLogo" width={18} height={18} fill="black" />
              </div>
              <div className="w-full pt-2">카카오톡 공유하기</div>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default NbreadInviteModal
