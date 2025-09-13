import BottomSheet from "../common/bottomsheet/BottomSheet"
import { useState } from "react";
import DefaultAvatar from '@/assets/avatar.svg'
interface PlusFreindeBottomSheetProps {
    isOpen : boolean
    onClose : () => void;
}
const PlusFriendBottomSheet = ({isOpen,onClose}:PlusFreindeBottomSheetProps) => {
    const [searchData, setSearchData] = useState()
    const userFreindData = [
    // { id: 0, avatar: DefaultAvatar, name: '유성현', status: '초대 하기' },
    // { id: 1, avatar: DefaultAvatar, name: '신혜민', status: '초대 하기' },
    // { id: 2, avatar: DefaultAvatar, name: '강보석', status: '초대 하기' },
    // { 
    //   id: 3,
    //   avatar: DefaultAvatar,
    //   name: '송수빈',
    //   status: '초대 하기',
    // },
    // {
    //   id: 4,
    //   avatar:DefaultAvatar,
    //   name: '빌게이츠',
    //   status: '초대 완료',
    // },
    // {
    //   id: 5,
    //   avatar: DefaultAvatar,
    //   name: '이재용',
    //   status: '참여 중',
    // },
    // {
    //   id: 6,
    //   avatar: DefaultAvatar,
    //   name: '머스크',
    //   status: '초대 하기',
    // },
    // {
    //   id: 7,
    //   avatar: DefaultAvatar,
    //   name: '머스크',
    //   status: '초대 하기',
    // },
    ]
    return (
        <>
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="flex h-[80vh] w-full flex-col px-[20px]">
          <div className="flex w-full items-center justify-start rounded-[8px] bg-gray-100 pr-[15px]">
            <input
              className="h-[48px] w-full resize-none rounded-[8px] border-none bg-gray-100 px-[30px] pt-[8px] text-[20px] outline-none focus:border-none focus:outline-none focus:ring-0"
              placeholder="태그로 검색하기"
              type="text"
              maxLength={4}
              value={searchData}
            ></input>
            
          </div>
          <div className="flex flex-col pt-[30px]">
            <p className="mb-[20px] text-body03 text-gray-500">검색결과</p>
            {userFreindData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-30">
                <p className="text-pretendard text-[16px]">
                  회원 태그를 검색해 초대할 수 있어요
                </p>
                <p className="text-pretendard cursor-pointer text-[14px] text-secondary-100 underline ">
                  초대하고 싶은 사람이 회원이 아니에요
                </p>
              </div>
            ) : (
              <div className="flex max-h-[400px] flex-col">
               
              </div>
            )}
          </div>
          
        </div>
        </BottomSheet>
        </>
    )
}
export default PlusFriendBottomSheet