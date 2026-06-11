import Icon from '../common/icon/Icon'
import DefaultAvatar from '@/assets/avatar.svg'
import { useState } from 'react'
import FriendBottomSheet from './FriendBottomSheet'
import Image from 'next/image'
import Avatar from '@/components/common/avatar/avatar'
interface friendProps {
  profile: string
  name: string
  tag: string
}
const FriendCard = ({ profile, name, tag }: friendProps) => {
  const [isBottomSheet, setIsBottomSheet] = useState(false)
  const handleBottomSheetOpen = () => {
    setIsBottomSheet(!isBottomSheet)
  }
  return (
    <div
      className="card flex flex-row items-center justify-between"
      onClick={handleBottomSheetOpen}
    >
      <div className="align-center flex flex-row items-center gap-16">
        <div className="w-40">
          <Avatar profileImageUrl={profile} size="large" />
        </div>
        <div className="cursor-pointer text-body01 text-gray-800">{name}</div>
        <div className="cursor-pointer text-body02 text-secondary-200">
          {`#${tag}`}
        </div>
      </div>
      {/* TODO 프로필 바텀시트 UI 구체화 후 작업 진행 */}
      {/* <button>
        <Icon
          type="angleRight"
          width={16}
          height={16}
          onClick={handleBottomSheetOpen}
          fill="text-gray-300"
        />
      </button> */}
      {/* <FriendBottomSheet
        isOpen={isBottomSheet}
        onClose={handleBottomSheetOpen}
        tag={tag}
        name={name}
        profile={profile}
      /> */}
    </div>
  )
}
export default FriendCard
