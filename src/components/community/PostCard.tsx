import { Post } from '@/types/post'
import Avatar from '../common/avatar/avatar'
import Icon from '../common/icon/Icon'
import { useEffect, useState } from 'react'
import UpdatePostBottomSheet from './UpdatePostBottomSheet'

interface PostCardProps {
  postData: Post
}

const PostCard = ({ postData }: PostCardProps) => {
  const [isUpdatePostBottomSheetOpen, setIsUpdatePostBottomSheetOpen] =
    useState<boolean>(false)

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
        <div className="cursor-pointer">
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
    </div>
  )
}

export default PostCard
