interface DropdownProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  onDelete: () => void
   top: number
  left: number
}
const DropdownMenu = ({ isOpen, onClose, onUpdate, onDelete,top,
  left }: DropdownProps) => {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      
      onClick={onClose}
    >
      <div
      style={{ top: top, left: left }}
        className=" shadow-modal absolute  rounded-[8px] border-white bg-white text-body02"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center justify-evenly cursor-pointer w-109 h-98">
          <div className="flex items-center pl-16 w-[100%] h-[100%]" onClick={onUpdate}>수정하기</div>
          <div className="w-77 h-1 bg-gray-100"></div>
          <div className="flex items-center pl-16 w-[100%] h-[100%]" onClick={onDelete}>삭제하기</div>
        </div>
      </div>
    </div>
  )
}
export default DropdownMenu
