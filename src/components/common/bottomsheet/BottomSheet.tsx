import React, { useRef, useState, useEffect } from 'react'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const startYRef = useRef<number | null>(null)
  const currentYRef = useRef<number>(0)
  const [dragging, setDragging] = useState(false)
  const [translateY, setTranslateY] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    setDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || startYRef.current === null) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startYRef.current
    if (deltaY > 0) {
      currentYRef.current = deltaY
      setTranslateY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    setDragging(false)
    if (currentYRef.current > 100) {
      onClose()
    } else {
      setTranslateY(0)
    }
    startYRef.current = null
    currentYRef.current = 0
  }

  useEffect(() => {
    if (!isOpen) {
      setTranslateY(0)
    }
  }, [isOpen])

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition duration-500 ease-in-out ${
          isOpen
            ? 'cursor-default bg-black bg-opacity-50'
            : 'pointer-events-none bg-black bg-opacity-0'
        }`}
        onClick={() => {
          setTimeout(() => {
            onClose()
          }, 0)
        }}
      >
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center transition-transform duration-500 ease-in-out ${
            isOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
          }`}
        >
          <div
            className="shadow-xl absolute bottom-0 mx-auto h-auto w-full max-w-[600px] rounded-t-2xl bg-white transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${translateY}px)` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들러 */}
            <div className="h-[40px] w-full">
              <div
                className="mx-auto mb-[24px] mt-[8px] h-[4px] w-[64px] rounded-[40px] bg-gray-200"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div
              className="h-full overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default BottomSheet
