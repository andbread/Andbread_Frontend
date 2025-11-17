'use client'
import DetailHeader from '@/components/common/header/DetailHeader'
import DashlineCard from '@/components/common/card/dashlineCard'
import PlusFriendBottomSheet from '@/components/friend/PlusFriendBottomSheet'
import { useEffect, useState } from 'react'
import FriendCard from '@/components/friend/FriendCard'
import DefaultAvatar from '@/assets/avatar.svg'
import useUserStore from '@/stores/useAuthStore'
import { getFriendList } from '@/lib/friend/getSearchFriend'
interface FriendProps {
  name : string
  profileImage : string
  tag: number

}
const FriendListPage = () => {
  const user = useUserStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [friendsData, setFriendsData]= useState<FriendProps[]>()
  const handleFriendPlus = () => {
    setIsModalOpen(true)
  }
  
  const fetchFriendList = async () => {
    console.log(user.user?.id)
    if (user) {
     const friendList =  await getFriendList(user.user?.id || null,null)
     console.log('제발용',friendList)
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
          profile={user.profileImage || '/default.png'}
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
