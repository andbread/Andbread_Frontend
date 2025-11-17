import BottomSheet from '../common/bottomsheet/BottomSheet'
import { useEffect, useState, useRef } from 'react'
import Icon from '../common/icon/Icon'
import InviteUserListItem from './InviteUserListItem'
import DefaultAvatar from '@/assets/avatar.svg'
import { getInviteUser } from '@/lib/invite/getInviteUser'
import { useParams } from 'next/navigation'
import { getFriendList } from '@/lib/friend/getSearchFriend'
import { getInviteFriendList } from '@/lib/friend/getSearchFriend'
interface InviteBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  user: string | null
}
interface User {
  avatar: any
  name: string
  status: string
  userId: string
}
interface Friend {
  name: string
  profileImage: string
  inviteState?:string
  tag: string
  id:string
  
}
const InviteBottomSheet = ({ isOpen, onClose,user }: InviteBottomSheetProps) => {
  const [searchData, setSearchData] = useState('') // 검색칸 입력 데이터
  const [fetchSearchData, setFetchSearchData] = useState<User[]>([]) // Api 반환 데이터
  const searchCache = useRef<Record<string, User[]>>({})
  const [friendListData, setFriendData] = useState<Friend[] | undefined>([])
  const params = useParams()
  const [nbreadId, setNbreadId] = useState<string>('')
  const [invitedUserId,setInvitedUserId] = useState('')
  const fetchFriendList = async () => {
    const fetchFriendListData = await getFriendList(user, params.nbreadId as string)
    setFriendData(fetchFriendListData)
    console.log('친구ㅡ 목 : ',friendListData)
  }
 
  useEffect(() => {
    if (isOpen) {
      setSearchData('')
      fetchFriendList()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchData.length == 4) {
      // 숫자 4글자 입력할시 디바운스 실행
      const typingSearchData = setTimeout(async () => {
        // 캐시에 이미 존재하는 데이터면 API 호출/필터링 생략
        if (searchCache.current[searchData]) {
          setFetchSearchData(searchCache.current[searchData])

          console.log('캐시 사용:', searchData)
          console.log('캐시 사용:', searchCache)
          return
        }
        const apiDataRaw =
          (await getInviteUser(searchData, params.nbreadId as string)) || []
          console.log('검색 유저! : ',apiDataRaw)
        const apiData: User[] = apiDataRaw.map((u) => ({
          avatar: u.profile_image, // profile_image → avatar로 매핑
          name: u.name,
          status: u.status,
          userId:u.id,

        }))
console.log('제발 상태야~~ :',apiData)
        // 캐시에 저장
        console.log(apiData)
        searchCache.current[searchData] = apiData
        setFetchSearchData(apiData || [])
        console.log('API 요청:', searchData)
      }, 1000)
      return () => clearTimeout(typingSearchData)
    }
  }, [searchData])
const refreshLists = async () => {
  // ✅ 1. 팔로잉 갱신
  await fetchFriendList()

  // ✅ 2. 검색 결과 갱신 (검색어가 있을 때만)
  if (searchData.length === 4) {
    const apiDataRaw = await getInviteUser(searchData, params.nbreadId as string) || []
    const apiData: User[] = apiDataRaw.map((u) => ({
      avatar: u.profile_image,
      name: u.name,
      status: u.status,
      userId: u.id,
    }))
    
    setFetchSearchData(apiData)
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
            <Icon type="search" width={20} height={20} />
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
                  <InviteUserListItem
                    key={index}
                    invitedUserId={user.userId}
                    avatar={user.avatar}
                    name={user.name}
                    status={user.status}
                    nbreadId={params.nbreadId as string}
                    onRefresh={refreshLists}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="mb-30 h-[2px] w-full bg-gray-100" />
            <p className="mb-[20px] text-body03 text-gray-500">팔로잉</p>
            <div className="flex max-h-[400px] flex-col">
              {friendListData?.map((user) => (
                <InviteUserListItem
                  key={user.id}
                  avatar={user.profileImage}
                  invitedUserId={user.id}
                  name={user.name}
                  status={user.inviteState!}
                  nbreadId={params.nbreadId as string}
                  onRefresh={refreshLists}
                />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
export default InviteBottomSheet
