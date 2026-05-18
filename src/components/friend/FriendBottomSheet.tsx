import BottomSheet from '../common/bottomsheet/BottomSheet'
import DefaultAvatar from '@/assets/avatar.svg'
import Icon from '../common/icon/Icon'
interface FriendBottoSheetProps {
  profile: string
  name: string
  tag: string
  isOpen: boolean
  onClose: () => void
}
const FriendBottomSheet = ({
  isOpen,
  onClose,
  tag,
  name,
  profile,
}: FriendBottoSheetProps) => {
  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col items-center justify-center gap-21">
          {profile && typeof profile === 'string' && profile !== '' ? (
            <img
              src={profile}
              alt={name}
              className="h-96 w-96 rounded-full object-cover"
            />
          ) : (
            <DefaultAvatar className="h-96 w-96 rounded-full object-cover" />
          )}
          <div className="mb-69 flex flex-row items-center gap-8">
            <h1 className="text-heading-02">{name}</h1>
            <p className="text-body-01 text-secondary-100">#{tag}</p>
          </div>
        </div>
        <div className="mb-30 flex flex-row justify-center gap-8">
          <button
            className="btn-small flex flex-row items-center justify-center gap-8 rounded-8 bg-system-blue01 text-white"
            onClick={() => null}
          >
            <Icon type="profile" fill="text-white" width={12} height={12} />
            팔로우 하기
          </button>
          <button
            className="btn-small flex flex-row items-center justify-center gap-8 rounded-8 bg-secondary-100 text-white"
            onClick={() => null}
          >
            <Icon type="plus" width={12} height={12} />
            초대하기
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
export default FriendBottomSheet
