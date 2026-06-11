import Modal from '@/components/common/modal/Modal'

interface InviteNoticeModalProps {
  isOpen: boolean
  title: string
  description: string
  buttonLabel: string
  onClose: () => void
  onSubmit: () => void
}

const InviteNoticeModal = ({
  isOpen,
  title,
  description,
  buttonLabel,
  onClose,
  onSubmit,
}: InviteNoticeModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-32 px-12 pb-8">
        <div className="flex flex-col gap-8">
          <h5 className="text-gray-800">{title}</h5>
          <p className="text-body02 text-gray-600">{description}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-medium"
          onClick={onSubmit}
        >
          {buttonLabel}
        </button>
      </div>
    </Modal>
  )
}

export default InviteNoticeModal
