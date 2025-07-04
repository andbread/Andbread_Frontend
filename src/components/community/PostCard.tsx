import { Post } from '@/types/post'
import Avatar from '../common/avatar/avatar'
import Icon from '../common/icon/Icon'

interface PostCardProps {
  postData: Post
}

const PostCard = ({ postData }: PostCardProps) => {
  return (
    <div className="card flex w-full flex-col gap-20">
      {/* 프로필 */}
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
      <div>{postData.content}</div>
    </div>
  )
}

export default PostCard
