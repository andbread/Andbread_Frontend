import Modal from "../common/modal/Modal";
interface InvitationToNbreadProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
  }
const InvitationToNbreadModal = ({isOpen,onClose,onSubmit} : InvitationToNbreadProps) => {
    return (
       <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col p-10">
         <p className="text-heading05 text-gray-800 mb-10 ">
            초대받은 엔빵이 존재합니다. 참여하시겠습니까?
          </p>
          <p className="text-body02 text-gray-800 mb-15 ">
            이 창을 나가면 참여가 불가능합니다!
          </p>
          <div className="flex flex-row items-center justify-center gap-5 pt-15">
            <button className="btn btn-small btn-disabled text-white"
            onClick={onClose}>거절</button>
            <button className="btn btn-small btn-primary"
            onClick={onSubmit}>참여</button>
          </div>
        </div>

       </Modal>
    )
}
export default InvitationToNbreadModal;