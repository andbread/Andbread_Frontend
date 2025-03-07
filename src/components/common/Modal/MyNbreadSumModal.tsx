import { useEffect, useState } from "react";
import Modal from "./Modal";
import { getUserTotalNbreadAmount } from "@/lib/nbread/getUserTotalNbreadAmount";
import useUserStore from "@/stores/useAuthStore";

interface MyNbreadSumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyNbreadSumModal = ({ isOpen, onClose }: MyNbreadSumModalProps) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const userData = useUserStore((state) => state.user);

  useEffect(() => {
    if (userData?.id) {
      const fetchTotalAmount = async () => {
        const total = await getUserTotalNbreadAmount(userData.id);
        setTotalAmount(total);
      };
      fetchTotalAmount();
    }
  }, [userData?.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <p className="text-heading04 font-bold text-gray-800 text-center">
        내가 그동안 엔빵한 총 금액은?
      </p>
      <p className="text-heading01 font-extrabold text-[#FF8204] text-center mt-24">
        {totalAmount.toLocaleString()}원
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
