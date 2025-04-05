'use client'

import { useState } from 'react'
import Icon from '../common/icon/Icon'
import BottomSheet from '../common/bottomsheet/BottomSheet'
const CreatePostButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="shadow-lg fixed bottom-4 right-4 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-secondary-100"
        onClick={() => setIsOpen(true)}
      >
        <Icon type="plus" width={24} height={24} fill="fill-white" />
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="mx-auto mb-[24px] mt-[8px] h-[4px] w-[64px] rounded-[40px] bg-gray-200" />
        <textarea
          className="mb-[25px] ml-[24px] mt-[10px] h-[374px] w-[calc(100%-48px)] rounded-lg border-none bg-gray-100 p-[24px]"
          placeholder="내용을 작성해보세요"
          rows={5}
        />

        <button className="btn btn-large mx-[24px] mb-[25px] w-[calc(100%-48px)] bg-secondary-100 text-white">
          게시물 작성하기
        </button>
      </BottomSheet>
    </>
  )
}

export default CreatePostButton
