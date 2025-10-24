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
  const friendData = [
    { id: 1, name: '신혜민', tag: 1111, profile: user.user?.profileImage },
    { id: 2, name: '김의진', tag: 1112, profile: user.user?.profileImage },
    { id: 3, name: '강보석', tag: 1113, profile: user.user?.profileImage },
    { id: 4, name: '송수빈', tag: 1114, profile: user.user?.profileImage },
    { id: 5, name: '유성현', tag: 1115, profile: user.user?.profileImage },
    { id: 6, name: '짱똘', tag: 1116, profile: user.user?.profileImage },
  ]
  const fetchFriendList = async () => {
    console.log(user.user?.id)
    if (user) {
     const friendList =  await getFriendList(user.user?.id || null)
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
