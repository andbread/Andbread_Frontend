import React from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      <div className="shadow-xl absolute bottom-0 mx-auto h-[519px] w-full rounded-t-2xl bg-white p-4">
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default BottomSheet
