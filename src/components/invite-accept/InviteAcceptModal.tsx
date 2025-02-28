import Modal from '../common/Modal/Modal'

import { inviteAcceptData } from './data'
interface InviteAcceptProps {
  isOpen: boolean
  onClose: () => void
}
const InviteAcceptModal = ({ isOpen, onClose }: InviteAcceptProps) => {
    const inviteStatus = inviteAcceptData.login;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col">
        <div className='pl-15'>
          <p className="text-heading05 text-gray-800 mb-10">
           {inviteStatus.title}
          </p>
          <p className="text-body02 text-gray-800 mb-15">
          {inviteStatus.subTitle}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-lg m-16 h-[48px] w-[232px] rounded-md bg-[#FFAC39] p-12 font-semibold text-white"
      >
        {inviteStatus.buttonTitle}
      </button>
    </Modal>
  )
}
export default InviteAcceptModal
