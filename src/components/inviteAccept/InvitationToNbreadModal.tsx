import Modal from '../common/modal/Modal'
import { useToast } from '../common/toast/Toast'
interface InvitationToNbreadProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}
const InvitationToNbreadModal = ({
  isOpen,
  onClose,
  onSubmit,
}: InvitationToNbreadProps) => {
  const clearNbreadID = () => {
    sessionStorage.removeItem('group_id')
    useToast.success('엔빵 초대를 거절했어요.')
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col p-10">
        <p className="mb-10 text-heading05 text-gray-800">
          초대받은 엔빵이 있어요.
        </p>
        <div className="flex flex-col gap-4 text-body02 text-gray-800">
          초대를 수락할까요? 이 창을 나가면 수락할 수 없어요.
        </div>
        <div className="flex flex-row items-center justify-center gap-8 pt-24">
          <button
            className="btn btn-small btn-secondary"
            onClick={clearNbreadID}
          >
            거절하기
          </button>
          <button className="btn btn-small btn-primary" onClick={onSubmit}>
            수락하기
          </button>
        </div>
      </div>
    </Modal>
  )
}
export default InvitationToNbreadModal
