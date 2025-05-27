'use client'

import DetailHeader from '@/components/common/header/DetailHeader'
import PostBoard from '@/components/community/NbreadTabs'
const CommunityPage = () => {
  return (
    <div className="flex flex-col justify-between p-24">
      <DetailHeader />
      <PostBoard />
    </div>
  )
}

export default CommunityPage
