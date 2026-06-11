'use client'
import DetailHeader from '@/components/common/header/DetailHeader'
import DashlineCard from '@/components/common/card/dashlineCard'
import PlusFriendBottomSheet from '@/components/friend/PlusFriendBottomSheet'
import { useEffect, useState } from 'react'
import FriendCard from '@/components/friend/FriendCard'
import useUserStore from '@/stores/useAuthStore'
import { FriendListItem, getFriendList } from '@/lib/friend/getSearchFriend'

const FriendListPage = () => {
  const user = useUserStore((state) => state.user)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [friendsData, setFriendsData] = useState<FriendListItem[]>([])
  const handleFriendPlus = () => {
    setIsModalOpen(true)
  }

  const fetchFriendList = async () => {
    if (user) {
      const friendList = await getFriendList(user.id, null)
      setFriendsData(friendList)
    }
  }
  useEffect(() => {
    if (user) {
      fetchFriendList()
    }
  }, [user])
  return (
    <div className="flex flex-col justify-between gap-8 p-24">
      <DetailHeader />
      <h2 className="mb-12 mt-25">친구 목록</h2>
      <DashlineCard
        text="친구 추가하기"
        iconType="plus"
        size={10}
        tailwindColor="text-gray-300"
        onClick={handleFriendPlus}
      />
      {friendsData?.map((user, index) => (
        <FriendCard
          key={index}
          profile={user.profileImage || ''}
          name={user.name}
          tag={user.tag}
        />
      ))}

      <PlusFriendBottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
export default FriendListPage
