'use client'

import NbreadDetail from '@/components/nbread/NbreadDetail'
import NbreadTabs from '@/components/community/NbreadTabs'
import DetailHeader from '@/components/common/header/DetailHeader'
const Page = () => {
  return (
    <>
      <div className="p-24">
        {/* 디테일헤더 페이지단으로 분리 */}
        <DetailHeader />
        <NbreadDetail />
      </div>

      {/* 아래 탭바 컴포넌트로 엔빵정보, 게시판, 채팅방 상태관리를 해줄생각 */}
      {/* <NbreadTabs/> */}
    </>
  )
}

export default Page
