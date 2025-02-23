import Modal from "./Modal";

interface MyNbreadSumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyNbreadSumModal = ({ isOpen, onClose }: MyNbreadSumModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <p className="text-heading04 font-bold text-gray-800 text-center">
        내가 그동안 엔빵한 총 금액은?
      </p>
      <p className="text-heading01 font-extrabold text-[#FF8204] text-center mt-24">
        375,200원
      </p>
      <button 
        onClick={onClose} 
        className="bg-[#FFAC39] text-white text-lg font-semibold w-[232px] h-[48px] p-12 m-16 rounded-md"
      >
        알겠어요
      </button>
    </Modal>
  );
};

export default MyNbreadSumModal;
