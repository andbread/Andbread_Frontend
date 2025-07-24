interface DropdownProps {
  isOpen: boolean
  onClose: () => void
}
const DropdownMenu = ({ isOpen, onClose }: DropdownProps) => {
     if (!isOpen) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="flex flex-col items-center bg-white"
      onClick={(e) => e.stopPropagation()}>
        <div>수정하기</div>
        <div>삭제하기</div>
      </div>
    </div>
  )
}
export default DropdownMenu
