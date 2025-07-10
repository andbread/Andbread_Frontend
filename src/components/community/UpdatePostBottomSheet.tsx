import { Post } from '@/types/post'
import BottomSheet, {
  BottomSheetProps,
} from '../common/bottomsheet/BottomSheet'
import { useToast } from '../common/toast/Toast'

interface UpdatePostBottomSheetProps
  extends Omit<BottomSheetProps, 'children'> {
  postData?: Post
}

const UpdatePostBottomSheet = ({
  isOpen,
  onClose,
  postData,
}: UpdatePostBottomSheetProps) => {
  const handleButtonClick = () => {
    onClose()
    useToast.success('게시글을 업데이트했어요.')
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <textarea
        className="mb-24 ml-24 h-374 w-[calc(100%-48px)] rounded-lg border-none bg-gray-100 p-24"
        placeholder="내용을 작성해보세요"
        defaultValue={postData?.content || ''}
        rows={5}
      />

      <button
        onClick={() => handleButtonClick()}
        className="btn btn-large btn-primary mx-24 mb-24 w-[calc(100%-48px)]"
      >
        게시글 작성하기
      </button>
    </BottomSheet>
  )
}

export default UpdatePostBottomSheet
