import Modal from '../common/modal/Modal'
import { deletePost } from '@/lib/post/deletePost'
import { useToast } from '../common/toast/Toast'
interface DeletePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  postId: number
  onSuccess: () => void
}
const DeletePostModal = ({
  isOpen,
  onClose,
  onSubmit,
  postId,
  onSuccess,
}: DeletePostModalProps) => {
    const handleDeletePost = async () =>{
        await deletePost(postId)
        onClose();
        onSuccess?.()
        useToast.success("게시글을 삭제했어요.")
    }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
         <div className="flex flex-col items-start p-8">
        <div className="mb-32 flex flex-col gap-8 pl-8">
          <div className="text-heading04 text-gray-800">
            게시글을 삭제하시겠어요?
          </div>
          <div className="text-body02 text-gray-800">
            삭제한 게시글 정보는 복구되지 않아요.
          </div>
        </div>
        <div className="flex flex-row gap-10">
          <button
            onClick={onClose}
            className="btn btn-small btn-secondary text-heading06"
          >
            취소하기
          </button>
          <button
            onClick={handleDeletePost}
            className="btn btn-small btn-warning text-heading06"
          >
            삭제하기
          </button>
        </div>
      </div>
    </Modal>
  )
  
}
export default DeletePostModal
