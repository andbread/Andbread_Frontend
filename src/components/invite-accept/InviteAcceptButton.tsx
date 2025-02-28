"use client"
import { useState } from "react";
import InviteAcceptModal from "./InviteAcceptModal";
const InviteAcceptButton = () => {
    const [ isModalOpen,setModalOpen ] = useState(false);
    const handleModalClose = () => {
        setModalOpen(false)
    };
    return (
       
       <div className="flex flex-col">
        <button className="btn-large bg-secondary-100 text-white rounded-8 mb-20"
        onClick={() => setModalOpen(true)}
        >초대 수락하기 🍞</button>
        <button className="text-gray-600 text-body02">홈으로 가기</button>
        <InviteAcceptModal
        isOpen={isModalOpen}
        onClose={handleModalClose}/>
       </div>
    )
}
export default InviteAcceptButton;