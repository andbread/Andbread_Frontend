import BottomSheet from '../common/bottomsheet/BottomSheet'
import { useState, useEffect, useRef } from 'react'
import PlusFriendListItem from './PlusFriendListItem'
import { getSearchFriend } from '@/lib/friend/getSearchFriend'
import useUserStore from '@/stores/useAuthStore'
import Spinner from '../common/spinner/Spinner'
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
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { user } = useUserStore()

  useEffect(() => {
    if (searchData.length !== 4) {
      setIsSearching(false)
      setHasSearched(false)
      setFetchSearchData([])
      return
    }

    let isCurrentSearch = true
    setIsSearching(true)

    const typingSearchData = setTimeout(async () => {
      const searchResult = await fetchSearchFriend(searchData)
      if (isCurrentSearch) {
        setFetchSearchData(searchResult)
        setHasSearched(true)
        setIsSearching(false)
      }
    }, 1000)

    return () => {
      isCurrentSearch = false
      clearTimeout(typingSearchData)
      setIsSearching(false)
    }
  }, [searchData, user?.id])

  const fetchSearchFriend = async (
    tag: string,
  ): Promise<searchFriendProps[]> => {
    if (!user?.id) return []

    if (searchCache.current[tag]) {
      return searchCache.current[tag]
    }

    const searchFriendData = await getSearchFriend(tag, user.id)
    const formattedData: searchFriendProps[] = (searchFriendData ?? []).map(
      (item) => ({
        name: item.name,
        profileImage: item.profileImage,
        status: item.status,
        senderId: item.senderId,
        receiverId: item.receiverId,
      }),
    )

    searchCache.current[tag] = formattedData
    return formattedData
  }
  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex h-[80vh] w-full flex-col px-[20px]">
          <Spinner isLoading={isSearching} />
          <div className="flex w-full items-center justify-start rounded-8 bg-gray-100">
            <input
              className="input-gray-no-line h-48 text-body01 text-gray-800"
              placeholder="태그로 검색하기"
              type="text"
              maxLength={4}
              value={searchData}
              onChange={(e) => setSearchData(e.target.value)}
            ></input>
          </div>
          <div className="flex h-full flex-col pt-24">
            <p className="mb-20 text-body03 text-gray-500">검색결과</p>
            {!isSearching &&
              (fetchSearchData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-30">
                  <p className="pt-64 text-16">
                    {hasSearched
                      ? '일치하는 회원태그가 없어요.'
                      : '회원 태그를 검색해 초대할 수 있어요'}
                  </p>
                  {!hasSearched && (
                    <p className="cursor-pointer pt-8 text-secondary-100 underline underline-offset-4">
                      초대하고 싶은 사람이 회원이 아니에요
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex max-h-[400px] flex-col">
                  {fetchSearchData.map((user) => (
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
              ))}
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
export default PlusFriendBottomSheet
