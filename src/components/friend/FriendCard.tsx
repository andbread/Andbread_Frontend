import Icon from '../common/icon/Icon'
import DefaultAvatar from '@/assets/avatar.svg'
import { useState } from 'react'
import FriendBottomSheet from './FriendBottomSheet'
interface friendProps {
  profile: string
  name: string
  tag: number
}
const FriendCard = ({ profile, name, tag }: friendProps) => {
    const [isBottomSheet,setIsBottomSheet] = useState(false)
    const handleBottomSheetOpen = () => {
        setIsBottomSheet(!isBottomSheet)
    }
  return (
    <div className="card mb-1 flex flex-row items-center justify-between px-32 py-26">
      <div className="flex flex-row items-center gap-16">
        {profile && typeof profile === 'string' && profile !== '' ? (
          <img
            src={profile}
            alt={name}
            className="h-32 w-32 rounded-full object-cover"
          />
        ) : (
          <DefaultAvatar className="h-32 w-32rounded-full object-cover" />
        )}
        <p className="text-body-02">{name}</p>
        <p className="text-body-02 text-secondary-100">#{tag}</p>
      </div>
      <Icon type="angleRight" width={16} height={16} onClick={handleBottomSheetOpen}/>
      <FriendBottomSheet isOpen={isBottomSheet} onClose={handleBottomSheetOpen}
      tag={tag}
      name={name}
      profile={profile}/>
    </div>
  )
}
export default FriendCard
