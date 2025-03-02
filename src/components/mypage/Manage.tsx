import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import LogoutModal from "../user/LogoutModal";
import DeleteAccountModal from "../user/DeleteAccountModal";
import { useState } from "react";
import { deleteAccount } from "@/lib/auth";
const Manage = () => {
  const router = useRouter();
  const [isLogoutModalOpen,setLogoutModalOpen] = useState(false);
  const [isDeleteAccountModalOpen,setDeleteAccountModalOpen] = useState(false);
  const handleLogout = async () => {
    await logout(router)
    
  }
  const handleDeleteAccount = async () => {
    setDeleteAccountModalOpen(false);
    await deleteAccount(router)
  }
  
    return (
      <div className="card p-24 mt-4">
        <ul className="py-2">
          <li className="py-10 text-body02 text-gray-800 cursor-pointer"
          onClick={()=>setLogoutModalOpen(true)}>로그아웃</li>
          <LogoutModal isOpen={isLogoutModalOpen} 
                        onClose={()=>setLogoutModalOpen(false)}
                        onSubmit={handleLogout}/>
          <li className="py-10 text-body02 text-gray-800 cursor-pointer"
          onClick={()=>setDeleteAccountModalOpen(true)}>탈퇴하기</li>
          <DeleteAccountModal isOpen={isDeleteAccountModalOpen} 
          onClose={()=>setDeleteAccountModalOpen(false)}
          onSubmit={handleDeleteAccount}/>
        </ul>
      </div>
    );
  };
  
  export default Manage;
  