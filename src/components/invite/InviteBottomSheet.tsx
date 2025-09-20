import BottomSheet from '../common/bottomsheet/BottomSheet'
import { useEffect, useState, useRef } from 'react'
import Icon from '../common/icon/Icon'
import InviteUserListItem from './InviteUserListItem'
import DefaultAvatar from '@/assets/avatar.svg'
import { getInviteUser } from '@/lib/invite/getInviteUser'
import { useParams } from 'next/navigation'
interface InviteBottomSheetProps {
  isOpen: boolean
  onClose: () => void
}
interface User {
  avatar: any
  name: string
  status: string
}
const InviteBottomSheet = ({ isOpen, onClose }: InviteBottomSheetProps) => {
  const [searchData, setSearchData] = useState('') // 검색칸 입력 데이터
  const [fetchSearchData, setFetchSearchData] = useState<User[]>([]) // Api 반환 데이터
  const searchCache = useRef<Record<string, User[]>>({})
  const params = useParams()
  const [nbreadId, setNbreadId] = useState<string>('')

  const userFollowingData = [
    { id: 0, avatar: DefaultAvatar, name: '유성현', status: '초대 하기' },
    { id: 1, avatar: DefaultAvatar, name: '신혜민', status: '초대 하기' },
    { id: 2, avatar: DefaultAvatar, name: '강보석', status: '초대 하기' },
    {
      id: 3,
      avatar: DefaultAvatar,
      name: '송수빈',
      status: '초대 하기',
    },
    {
      id: 4,
      avatar: DefaultAvatar,
      name: '빌게이츠',
      status: '초대 완료',
    },
    {
      id: 5,
      avatar: DefaultAvatar,
      name: '이재용',
      status: '참여 중',
    },
    {
      id: 6,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 7,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 8,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 9,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 10,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 11,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 12,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 13,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 14,
      avatar: DefaultAvatar,
      name: '머스크',
      status: '초대 하기',
    },
  ]
  useEffect(() => {
    if (isOpen) {
      setSearchData('')
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
        const apiData: User[] = apiDataRaw.map((u) => ({
          avatar: u.profile_image, // profile_image → avatar로 매핑
          name: u.name,
          status: u.status,
        }))

        // 캐시에 저장
        console.log(apiData)
        searchCache.current[searchData] = apiData
        setFetchSearchData(apiData || [])
        console.log('API 요청:', searchData)
      }, 1000)
      return () => clearTimeout(typingSearchData)
    }
  }, [searchData])

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
                    avatar={user.avatar}
                    name={user.name}
                    status={user.status}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="mb-30 h-[2px] w-full bg-gray-100" />
            <p className="mb-[20px] text-body03 text-gray-500">팔로잉</p>
            <div className="flex max-h-[400px] flex-col">
              {userFollowingData.map((user) => (
                <InviteUserListItem
                  key={user.id}
                  avatar={user.avatar}
                  name={user.name}
                  status={user.status}
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
