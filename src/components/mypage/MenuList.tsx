'use client'

import { useState } from 'react'
import MyNbreadSumModal from '@/components/common/modal/MyNbreadSumModal'

const MenuList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleFeedbackClick = () => {
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLScBvCTWYzkAXY266B4nnMjBI_4OsVNZA_ejsBV9EAKXtLAq5g/viewform',
      '_blank'
    )
  }

  return (
    <div className="card p-28">
      <ul>
        <li
          className="mb-20 cursor-pointer text-body02 text-gray-800"
          onClick={() => setIsModalOpen(true)}
        >
          나의 엔빵 합계 확인하기
        </li>
        <li className="cursor-pointer text-body02 text-gray-800" onClick={handleFeedbackClick}>
          개발진에게 의견 보내기
        </li>
      </ul>

      <MyNbreadSumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default MenuList
