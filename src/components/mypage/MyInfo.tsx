"use client";

import Avatar from "../../components/common/avatar/avatar";
import useUserStore from "@/stores/useAuthStore"; 

const MyInfo = () => {
  const { user } = useUserStore(); 

  return (
    <div className="card mt-12">
      <div className="flex items-center justify-between px-6 py-4">
        <Avatar profileImageUrl={user?.profileImage || "/default-avatar.png"} size="large" />

        <div className="flex-shrink-0 justify-between mr-225 ml-12">
          <p className="font-bold mb-5 text-heading05 text-gray-800">{user?.name || "이름 없음"}</p>
          <p className="text-body04 text-gray-600 whitespace-nowrap">
            {user?.socialType?.toUpperCase() || "소셜 로그인"} 계정
            <span className="text-body04 text-gray-400 ml-12 mr-36 whitespace-nowrap">{user?.email || "이메일 없음"}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyInfo;
