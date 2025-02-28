import Modal from "../common/Modal/Modal";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void; 
}

const LogoutModal = ({ isOpen, onClose, onSubmit }: LogoutModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col p-8">
                <h2 className="text-heading05 font-semibold text-gray-800 mb-10 ">로그아웃 하시겠습니까?</h2>
                <p className="text-body02 text-gray-600 mb-30 ">로그아웃을 진행하면, 다시 로그인해야합니다.</p>
                <div className="flex flex-row gap-10 ">
                <button
                    onClick={onClose}
                    className="bg-gray-300 text-gray-800 rounded-md btn-small text-heading06"
                >
                    취소
                </button>
                <button
                    onClick={onSubmit} 
                    className="bg-red-500 text-white rounded-md btn-small text-heading06 "
                >
                    로그아웃
                </button>
                </div>
            </div>
        </Modal>
    );
};

export default LogoutModal;
