import BottomSheet from '../common/bottomsheet/BottomSheet'
import { useState, useEffect, useRef } from 'react'
import DefaultAvatar from '@/assets/avatar.svg'
import PlusFriendListItem from './PlusFriendListItem'
import { getSearchFriend } from '@/lib/friend/getSearchFriend'
import useUserStore from '@/stores/useAuthStore'
interface PlusFreindeBottomSheetProps {
  isOpen: boolean
  onClose: () => void
}
interface searchFriendProps {
  name: string
  profileImage: string
  status: string
  senderId: string
  receiverId: string
}
const PlusFriendBottomSheet = ({
  isOpen,
  onClose,
}: PlusFreindeBottomSheetProps) => {
  const [searchData, setSearchData] = useState('')
  const searchCache = useRef<Record<string, searchFriendProps[]>>({})
  const [fetchSearchData, setFetchSearchData] = useState<searchFriendProps[]>(
    [],
  )
  const { user } = useUserStore()

  useEffect(() => {
    if (searchData.length == 4) {
      const typingSearchData = setTimeout(() => {
        fetchSearchFriend(searchData)
      }, 1000)
      return () => clearTimeout(typingSearchData)
    }
  }, [searchData])

  const fetchSearchFriend = async (tag: string) => {
    if (user?.id) {
      const searchFriendData = await getSearchFriend(tag, user?.id)
      const formattedData: searchFriendProps[] = (searchFriendData ?? []).map(
        (item) => ({
          name: item.name,
          profileImage: item.profileImage,
          status: item.status,
          senderId: item.senderId,
          receiverId: item.receiverId,
        }),
      )

      setFetchSearchData(formattedData)
    }
  }
  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex h-[80vh] w-full flex-col px-[20px]">
          <div className="flex w-full items-center justify-start rounded-[8px] bg-gray-100 pr-[15px]">
            <input
              className="h-[48px] w-full resize-none rounded-[8px] border-none bg-gray-100 px-[30px] pt-[8px] text-[20px] outline-none focus:border-none focus:outline-none focus:ring-0"
              placeholder="태그로 검색하기"
              type="text"
              maxLength={4}
              value={searchData}
              onChange={(e) => setSearchData(e.target.value)}
            ></input>
          </div>
          <div className="flex flex-col pt-[30px]">
            <p className="mb-[20px] text-body03 text-gray-500">검색결과</p>
            {fetchSearchData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-30">
                <p className="text-pretendard text-[16px]">
                  회원 태그를 검색해 초대할 수 있어요
                </p>
                <p className="text-pretendard cursor-pointer text-[14px] text-secondary-100 underline">
                  초대하고 싶은 사람이 회원이 아니에요
                </p>
              </div>
            ) : (
              <div className="flex max-h-[400px] flex-col">
                {fetchSearchData.map((user, index) => (
                  <PlusFriendListItem
                    key={user.receiverId}
                    name={user.name}
                    profile={user.profileImage}
                    status={user.status ? user.status : ''}
                    senderId={user.senderId}
                    receiverId={user.receiverId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
export default PlusFriendBottomSheet
