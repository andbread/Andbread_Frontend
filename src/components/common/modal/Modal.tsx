import { ReactNode } from 'react'
import Icon from '../icon/Icon'
import classNames from 'classnames'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  return (
    <div
      className={classNames(
        'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-out',
        { 'visible opacity-100': isOpen, 'invisible opacity-0': !isOpen },
      )}
      onClick={onClose}
    >
      <div
        className={classNames(
          'shadow-lg relative min-w-280 transform rounded-lg bg-white p-12 transition-all duration-300 ease-out',
          {
            'translate-y-0 opacity-100': isOpen,
            'translate-y-10 opacity-0': !isOpen,
          },
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-15 top-15 rounded-full bg-gray-200"
        >
          <Icon type="cross" width={16} height={16} fill="text-gray-500" />
        </button>
        <div className="mt-20 w-full">{children}</div>
      </div>
    </div>
  )
}

export default Modal
