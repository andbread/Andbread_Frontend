'use client'

import DetailHeader from '@/components/common/header/DetailHeader'
import MyInfo from '@/components/mypage/MyInfo'
import MenuList from '@/components/mypage/MenuList'
import Manage from '@/components/mypage/Manage'
import { useState } from 'react'
import Spinner from '@/components/common/spinner/Spinner'

const MyPage = () => {
  const [authProgress, setAuthProgress] = useState<boolean>(false)

  if (authProgress) {
    return <Spinner isLoading={authProgress} />
  }

  return (
    <div className="flex flex-col justify-between p-24">
      <DetailHeader />
      <main className="mt-24">
        <section>
          <h2 className="mb-12 text-heading02 text-gray-800">내 정보</h2>
          <MyInfo />
        </section>
        <section>
          <div className="mb-12 mt-40 text-body02 text-gray-500">기타</div>
          <MenuList />
        </section>
        <section>
          <h2 className="mb-12 mt-40 text-body02 text-gray-500">계정 관리</h2>
          <Manage setAuthProgress={setAuthProgress} />
        </section>
      </main>
    </div>
  )
}

export default MyPage
