"use client";

import { useState } from "react";
import MyNbreadSumModal from "@/components/common/modal/MyNbreadSumModal";

const MenuList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
      <div className="card p-24 mt-4">
        <ul className="py-2">
          <li className="py-10 text-body02 text-gray-800 cursor-pointer" onClick={() => setIsModalOpen(true)}>나의 엔빵 합계 확인하기</li>
          <li className="py-10 text-body02 text-gray-800 cursor-pointer">개발진에게 의견 보내기</li>
        </ul>
        
        <MyNbreadSumModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      </div>
    );
  };
  
  export default MenuList;
  