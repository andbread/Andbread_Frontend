import { Post } from '@/types/post'
import Avatar from '../common/avatar/avatar'
import Icon from '../common/icon/Icon'
import { useEffect, useState } from 'react'
import UpdatePostBottomSheet from './UpdatePostBottomSheet'
import DropdownMenu from './DropdownMenu'
import DeletePostModal from './DeletePostModal'
import { useRef } from 'react'
interface PostCardProps {
  postData: Post
}

const PostCard = ({ postData }: PostCardProps) => {
  const [isUpdatePostBottomSheetOpen, setIsUpdatePostBottomSheetOpen] =
    useState<boolean>(false)
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const dotsButtonRef = useRef<HTMLDivElement | null>(null)
   const handleDotsClick = () => {
    if (dotsButtonRef.current) {
      const rect = dotsButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom-20, // 아래로 8px
        left: rect.left-90,
      })
      setIsDropdownMenuOpen(true)
    }
  }
  return (
    
    <div className="card flex w-full flex-col gap-20">
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-row items-start gap-8">
          <Avatar size="large" profileImageUrl={postData.userProfileImage} />
          <div className="flex flex-col gap-4">
            <div className="text-body02 text-gray-700">{postData.userName}</div>
            <div className="text-body03 text-gray-400">
              {postData.createdAt}
            </div>
          </div>
        </div>
        <div  ref={dotsButtonRef} className="cursor-pointer"
        onClick={handleDotsClick}>
          <Icon type="menuDots" width={20} height={20} />
        </div>
      </div>
      <div className="text-paragraph">{postData.content}</div>
      
      {/* 바텀시트 */}
      <UpdatePostBottomSheet
        isOpen={isUpdatePostBottomSheetOpen}
        onClose={() => {
          setIsUpdatePostBottomSheetOpen(false)
        }}
        postData={postData}
      />
      <DropdownMenu
      top={dropdownPosition.top}
        left={dropdownPosition.left}
      onUpdate={() => {setIsUpdatePostBottomSheetOpen(true),setIsDropdownMenuOpen(false)}}
      onDelete={() => {setIsDropdownMenuOpen(false),setIsDeleteModalOpen(true)}}
      isOpen={isDropdownMenuOpen}
      onClose={() => {setIsDropdownMenuOpen(false)}}/>
      <DeletePostModal
      isOpen={isDeleteModalOpen}
      onClose={() => {setIsDeleteModalOpen(false)}}
      onSubmit={() => {setIsDeleteModalOpen(false)}}/>
    </div>
  )
}

export default PostCard
