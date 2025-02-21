"use client"

import { useRouter } from "next/navigation";

interface AddLogButtonProps {}

const AddLogButton = ({}: AddLogButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/nbread/create"); 
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-250 p-24 text-center rounded-lg cursor-pointer"
      onClick={handleClick}
    >
      <p className="text-gray-500">+ 엔빵 추가하기</p>
    </div>
  );
};

export default AddLogButton;
