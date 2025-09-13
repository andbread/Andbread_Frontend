import BottomSheet from '../common/bottomsheet/BottomSheet'
import DefaultAvatar from '@/assets/avatar.svg'
import Icon from '../common/icon/Icon'
interface FriendBottoSheetProps {
  profile: string
  name: string
  tag: number
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
    const handleFollow = () =>{
        console.log("팔로우 버튼")
    }
    const handleInvited = () =>{
        console.log("초대하기 버튼")
    }
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
          <div className="flex flex-row items-center gap-8 mb-69">
            <h1 className="text-heading-02">{name}</h1>
            <p className="text-body-01 text-secondary-100">#{tag}</p>
          </div>
        </div>
        <div className='flex flex-row justify-center gap-8 mb-30'>
          <button className="btn-small bg-system-blue01 text-white flex flex-row items-center justify-center gap-8 rounded-8"
          onClick={handleFollow}>
            <Icon type="profile" width={12} height={12}/>
            팔로우 하기</button>
          <button className="btn-small bg-secondary-100 text-white flex flex-row items-center justify-center gap-8 rounded-8"
          onClick={handleInvited}>
            <Icon type="plus" width={12} height={12}/>
            초대하기</button>
        </div>
      </BottomSheet>
    </>
  )
}
export default FriendBottomSheet
