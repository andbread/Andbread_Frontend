"use client";

import DetailHeader from "@/components/common/header/DetailHeader";
import MyInfo from "@/components/mypage/MyInfo";
import MenuList from "@/components/mypage/MenuList";
import Manage from "@/components/mypage/Manage";

const MyPage = () => {
  return (
    <div className="flex flex-col justify-between p-24">
        <DetailHeader></DetailHeader>
      <main className="p-4 mt-24">
        <section>
          <h2 className="text-heading04 font-bold mb-24 text-gray-800">내 정보</h2>
          <MyInfo />
        </section>
        <section>
          <h2 className="text-body03 mb-24 mt-24 text-gray-500">기타</h2>
          <MenuList />
        </section>
        <section>
          <h2 className="text-body03 mb-24 mt-24 text-gray-500">계정 관리</h2>
          <Manage />
        </section>
      </main>
    </div>
  );
};

export default MyPage;
