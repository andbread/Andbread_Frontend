'use client'

import Avatar from '../common/avatar/avatar'
import useUserStore from '@/stores/useAuthStore'
import Tabbar from '../common/tabbar/tabbar'
import CreatePostButton from './CreatePostButton'

const PostBoard = () => {
  const { user } = useUserStore()

  return (
    <>
      <span className="gray-800 mb-[12px] mt-[24px] text-heading02">
        유튜브 프리미엄
      </span>
      <Tabbar tabs={['엔빵 정보', '게시판', '채팅방']} onTabChange={() => {}} />
      <div className="card card-shade mt-[24px] h-[172px] w-[272px] p-[24px]">
        <Avatar
          size="large"
          profileImageUrl={user ? user.profileImage : undefined}
        />
      </div>
      <CreatePostButton />
    </>
  )
}

export default PostBoard
