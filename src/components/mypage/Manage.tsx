import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import LogoutModal from "../user/LogoutModal";
import { useState } from "react";
const Manage = () => {
  const router = useRouter();
  const [isLogoutModalOpen,setLogoutModalOpen] = useState(false);
  const handleLogout = async () => {
    await logout(router)
    
  }
  
    return (
      <div className="card p-24 mt-4">
        <ul className="py-2">
          <li className="py-10 text-body02 text-gray-800 cursor-pointer"
          onClick={()=>setLogoutModalOpen(true)}>로그아웃</li>
          <LogoutModal isOpen={isLogoutModalOpen} 
                        onClose={()=>setLogoutModalOpen(false)}
                        onSubmit={handleLogout}/>
          <li className="py-10 text-body02 text-gray-800 cursor-pointer">탈퇴하기</li>
        </ul>
      </div>
    );
  };
  
  export default Manage;
  