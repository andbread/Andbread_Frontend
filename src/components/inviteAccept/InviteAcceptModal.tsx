import Modal from '../common/Modal/Modal'


interface InviteAcceptProps {
  isOpen: boolean
  onClose: () => void
}
const InviteAcceptModal = ({ isOpen, onClose }: InviteAcceptProps) => {
 
const inviteAcceptData = {
      login: {
          title: "먼저 로그인이 필요해요.",
          subTitle: "엔빵에 참여하려면 로그인을 해야 해요.",
          buttonTitle: "로그인하러 가기"
      },
      completed: {
          title: "엔빵 참여가 완료되었어요.",
          subTitle: "참여한 엔빵 정보를 바로 확인할 수 있어요.",
          buttonTitle: "엔빵확인하러 가기"
      },
      expired: {
          title: "엔빵 초대가 만료되었어요.",
          subTitle: "링크가 만료되어 초대를 수락할 수 없어요.",
          buttonTitle: "홈으로 가기"
      }
    }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col">
        <div className='pl-15'>
          <p className="text-heading05 text-gray-800 mb-10">
           {inviteAcceptData.login.title}
          </p>
          <p className="text-body02 text-gray-800 mb-15">
          {inviteAcceptData.login.subTitle}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-lg m-16 h-[48px] w-[232px] rounded-md bg-[#FFAC39] p-12 font-semibold text-white"
      >
        {inviteAcceptData.login.buttonTitle}
      </button>
    </Modal>
  )
}
export default InviteAcceptModal
