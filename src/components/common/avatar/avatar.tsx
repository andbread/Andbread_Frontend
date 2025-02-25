import DefaultAvatar from '@/assets/avatar.svg'
import Image from 'next/image'
import Icon from '../icon/icon'

const avatarSizeMap = { small: 24, large: 32 } as const

interface AvatarProps {
  size: keyof typeof avatarSizeMap
  profileImageUrl?: string
  isNbreadLeader?: boolean
}

const Avatar = ({ size, profileImageUrl, isNbreadLeader }: AvatarProps) => {
  const avatarSize = avatarSizeMap[size]

  return (
    <div className="relative">
      {profileImageUrl ? (
        <Image
          alt="프로필 이미지"
          src={profileImageUrl}
          className="rounded-40"
          width={avatarSize}
          height={avatarSize}
          style={{
            display: "block", 
            objectFit: "cover",
            width: `${avatarSize}px`, 
            height: `${avatarSize}px`,
          }}
        />
      ) : (
        <DefaultAvatar
          width={avatarSize}
          height={avatarSize}
          aria-label={'프로필 이미지'}
          viewBox="0 0 36 36"
        />
      )}
      {isNbreadLeader && (
        <div className="absolute bottom-0 right-0">
          <Icon type="badge" width={12} height={12} fill="text-secondary-200" />
        </div>
      )}
    </div>
  )
}

export default Avatar
