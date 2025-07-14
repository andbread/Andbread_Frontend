import BottomSheet from '../common/bottomsheet/BottomSheet'
import { useState } from 'react'
import Icon from '../common/icon/Icon'
import InviteUserListItem from './InviteUserListItem'
import DefaultAvatar from '@/assets/avatar.svg'
interface InviteBottomSheetProps {
  isOpen: boolean
  onClose: () => void
}
const InviteBottomSheet = ({ isOpen, onClose }: InviteBottomSheetProps) => {
  const userFollowingData = [
    { id: 0, avatar: DefaultAvatar, name: '유성현', status: '초대 하기' },
    { id: 1, avatar: DefaultAvatar, name: '신혜민', status: '초대 하기' },
    { id: 2, avatar: DefaultAvatar, name: '강보석', status: '초대 하기' },
    {
      id: 3,
      avatar: 'https://example.com/avatar-1.png',
      name: '송수빈',
      status: '초대 하기',
    },
    {
      id: 4,
      avatar: 'https://example.com/avatar-1.png',
      name: '빌게이츠',
      status: '초대 완료',
    },
    {
      id: 5,
      avatar: 'https://example.com/avatar-1.png',
      name: '이재용',
      status: '참여 중',
    },
    {
      id: 6,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 7,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 8,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 9,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 10,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 11,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 12,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 13,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },
    {
      id: 14,
      avatar: 'https://example.com/avatar-1.png',
      name: '머스크',
      status: '초대 하기',
    },

  ]

   
  
  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex h-[80vh] w-full flex-col px-[20px]">
          
          <div className="flex w-full items-center justify-start rounded-[8px] bg-gray-100 pr-[15px]">
            <textarea
              className="h-[48px] w-full resize-none rounded-[8px] bg-gray-100 px-[30px] pt-[8px] text-[20px] outline-none"
              placeholder="태그로 검색하기"
            ></textarea>
            <Icon type="search" width={20} height={20} />
          </div>
          <div className="flex flex-col pt-[30px]">
            <p className="text-body03 text-gray-500">검색결과</p>
            <div className="flex flex-col items-center justify-center p-[30px]">
              <p className="text-pretendard text-[16px]">
                회원 태그를 검색해 초대할 수 있어요
              </p>
              <p className="text-pretendard cursor-pointer text-[14px] text-secondary-100 underline">
                초대하고 싶은 사람이 회원이 아니에요
              </p>
            </div>
          </div>
          <div className="h-[2px] w-full bg-gray-100" />
          <div className="flex flex-col pt-[30px] ">
            <p className="text-body03 text-gray-500 mb-[20px]">팔로잉</p>
            <div className="flex flex-col  max-h-[400px]">
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
