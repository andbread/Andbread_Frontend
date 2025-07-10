'use client'

import { useState } from 'react'
import Icon from '../common/icon/Icon'
import UpdatePostBottomSheet from './UpdatePostBottomSheet'

const CreatePostButton = () => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

  return (
    <>
      <button
        className="shadow-lg fixed bottom-16 right-16 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-secondary-100"
        onClick={() => setIsBottomSheetOpen(true)}
      >
        <Icon type="plus" width={24} height={24} fill="fill-white" />
      </button>

      <UpdatePostBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => {
          setIsBottomSheetOpen(false)
        }}
      />
    </>
  )
}

export default CreatePostButton
