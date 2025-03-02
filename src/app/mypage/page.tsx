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
      <DetailHeader></DetailHeader>
      <main className="mt-24 p-4">
        <section>
          <h2 className="mb-24 text-heading04 font-bold text-gray-800">
            내 정보
          </h2>
          <MyInfo />
        </section>
        <section>
          <h2 className="mb-24 mt-24 text-body03 text-gray-500">기타</h2>
          <MenuList />
        </section>
        <section>
          <h2 className="mb-24 mt-24 text-body03 text-gray-500">계정 관리</h2>
          <Manage setAuthProgress={setAuthProgress} />
        </section>
      </main>
    </div>
  )
}

export default MyPage
