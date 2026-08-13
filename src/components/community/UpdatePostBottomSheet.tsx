import { Post, PostInsert } from '@/types/post'
import { useState } from 'react'
import { useEffect } from 'react'
import BottomSheet, {
  BottomSheetProps,
} from '../common/bottomsheet/BottomSheet'
import { useToast } from '../common/toast/Toast'
import { InsertPost } from '@/lib/post/insertPost'
import useUserStore from '@/stores/useAuthStore'
import { useParams } from 'next/navigation'
import { UpdatePost } from '@/lib/post/updatePost'
interface UpdatePostBottomSheetProps
  extends Omit<BottomSheetProps, 'children'> {
  postData?: Post
  postState: string
  onSuccess?: () => void
}
const UpdatePostBottomSheet = ({
  isOpen,
  onClose,
  postData,
  postState,
  onSuccess,
}: UpdatePostBottomSheetProps) => {
  const user = useUserStore((state) => state.user)
  const [content, setContent] = useState('')
  const [isOpenSheet, setIsOpenSheet] = useState<boolean>(false)
  const params = useParams()
  const handleButtonClick = async () => {
    const nbreadId = params.nbreadId as string
    if (!user) return

    if (postState === 'created') {
      const post: PostInsert = {
        content: content,
        userId: user.id || '',
        userName: user.name || '',
        userProfileImage: user.profileImage || '',
        nbreadId: nbreadId,
        createdAt: new Date(Date.now() + 9 * 60 * 60 * 1000) // KST 기준으로 보정
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19),
      }
      await InsertPost(post)
      onClose()
      setTimeout(() => {
        setContent('')
      }, 200)
      useToast.success('게시글을 작성했어요.')
      onSuccess?.()
    } else {
      const post: Post = {
        id: postData!.id,
        content: content,
        userId: user.id || '',
        userName: user.name || '',
        userProfileImage: user.profileImage || '',
        nbreadId: nbreadId,
        createdAt: new Date(Date.now() + 9 * 60 * 60 * 1000) // KST 기준으로 보정
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, '.'),
      }
      await UpdatePost(post)
      onClose()
      setTimeout(() => {
        setContent('')
      }, 200)
      useToast.success('게시글을 업데이트했어요.')
      onSuccess?.()
    }
  }
  useEffect(() => {
    setContent(postData?.content ?? '')
  }, [])

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <textarea
        className="mb-24 ml-24 h-374 w-[calc(100%-48px)] rounded-lg border-none bg-gray-100 p-24"
        placeholder="내용을 작성해보세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
      />
      {postState === 'created' ? (
        <button
          onClick={handleButtonClick}
          disabled={content.trim() === '' && postData?.content === ''}
          className={`btn btn-large mx-24 mb-24 w-[calc(100%-48px)] ${
            content.trim() === '' ? 'btn-disabled bg-gray-300' : 'btn-primary'
          }`}
        >
          게시글 작성하기
        </button>
      ) : (
        <button
          onClick={handleButtonClick}
          disabled={postData?.content === ''}
          className={`btn btn-large mx-24 mb-24 w-[calc(100%-48px)] ${
            content.trim() === '' ? 'btn-disabled bg-gray-300' : 'btn-primary'
          }`}
        >
          게시글 수정하기
        </button>
      )}
    </BottomSheet>
  )
}

export default UpdatePostBottomSheet
