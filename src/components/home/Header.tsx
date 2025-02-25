"use client"; 

import { useRouter } from "next/navigation"; 
import Icon from "@/components/common/icon/Icon";
import Avatar from "@/components/common/avatar/Avatar"; 

const Header = () => {
  const router = useRouter(); 

  return (
    <header className="flex justify-between items-center px-4 py-4">
      <h1 className="pb-12 pt-20">로고</h1>
      <div className="flex gap-20 mr-12">
        <button onClick={() => router.push("/calendar")} className="cursor-pointer mt-10">
          <Icon type="calendar" width={24} height={24} fill="text-gray-600" />
        </button>
        <button onClick={() => router.push("/mypage")} className="cursor-pointer mt-8 w-24 h-24">
          <Avatar size="large" profileImageUrl={undefined} isNbreadLeader={false} />
        </button>
      </div>
    </header>
  );
};

export default Header;
