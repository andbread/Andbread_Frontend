"use client";
import { useEffect, useState } from "react";
import { getUserNbreads } from "@/lib/nbread/getuserNbread";
import Header from "@/components/home/Header";
import AddLogButton from "@/components/home/AddLogButton";
import Emptylog from "@/components/home/Emptylog";
import Avatar from "@/components/common/avatar/avatar"; 

interface HomePageProps {
  profileImageUrl: string; 
}

const HomePage = ({ profileImageUrl }: HomePageProps) => {
  const [nbreadList, setNbreadList] = useState([]); 
  const [userId, setUserId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);

  useEffect(() => {
    const userStore = sessionStorage.getItem("user-store");
    if (userStore) {
      const userData = JSON.parse(userStore).state?.user;
      if (userData?.id) {
        console.log("✅ 로그인된 유저 ID:", userData.id);
        setUserId(userData.id);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchNbreads = async () => {
      const nbreads = await getUserNbreads(userId);
      console.log("✅ 불러온 엔빵 데이터:", nbreads);
      setNbreadList(nbreads);
      const total = nbreads.reduce((sum, nbread) => 
        sum + Math.floor(nbread.amount / Math.max(nbread.participant_count, 1)), 0
      );
      setTotalAmount(total);
    };

    fetchNbreads();
  }, [userId]);

  return (
    <div className="flex flex-col justify-between p-24 pt-16">
      <Header />
      <main className="p-4 mt-24">
        {/* --------------- 이번 달 엔빵 --------------- */}
        <section>
        <h2 className="text-heading04 font-bold mb-24 text-gray-800">이번 달 엔빵</h2>
          {nbreadList.length > 0 ? (
            <>
              <div className="bg-primary-400 text-[#333036] p-36 rounded-lg shadow-md mb-4">
                <p className="text-body03 font-medium flex items-center">
                  {currentMonth}월 엔빵 🍞
                </p>
                <p className="text-[18px] font-bold">{totalAmount.toLocaleString()}원</p>
              </div>

              {/* 🔹 엔빵 리스트 */}
              <div className="flex flex-col gap-6">
                {nbreadList.map((nbread, index) => (
                  <div key={index} className="bg-white p-24 rounded-lg shadow flex items-center justify-between">
                    <div className="pl-10">
                      <p className="text-body02 font-bold mb-4">{nbread.title}</p>
                      <p className="text-body03 text-gray-500">
                        {Math.floor(nbread.amount / nbread.participant_count).toLocaleString()}원 / 
                        {nbread.payment_period === "year" ? " 매년" : " 매월"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end w-[100px] mr-12">
                      {/* ✅ 참여자 Avatar 아이콘 */}
                      <div className="flex justify-end mb-2 w-full">
                        {Array.from({ length: nbread.participant_count }).map((_, idx) => (
                          <div key={idx} className="relative -ml-10">
                            <Avatar size="large" profileImageUrl={profileImageUrl} />
                          </div>
                        ))}
                      </div>
                      {/* 참여 인원 상태 */}
                      <p className="text-body04 text-secondary-300">미완료 0/{nbread.participant_count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Emptylog />
          )}
        </section>

        {/* --------------- 나의 엔빵 --------------- */}
        <section className="mt-40">
        <h2 className="text-heading04 font-bold mb-24 text-gray-800">
          나의 엔빵
          {nbreadList.length > 0 && (
            <span className="text-secondary-200 ml-6 text-heading05">{nbreadList.length}개</span>
          )}
        </h2>
          <AddLogButton />
          {/* 🔹 나의 엔빵 리스트 */}
          <div className="flex flex-col gap-4 mt-12">
            {nbreadList.map((nbread, index) => (
              <div key={index} className="bg-white p-24 rounded-lg shadow flex items-center justify-between">
                <div className="pl-10 flex flex-col justify-between h-full">
                  <p className="text-body02 font-bold text-gray-800 mb-4">{nbread.title}</p>
                  <p className="text-body03 text-gray-500">
                    {Math.floor(nbread.amount / nbread.participant_count).toLocaleString()}원 / 
                    {nbread.payment_period === "year" ? " 매년" : " 매월"}
                  </p>
                </div>
                <div className="flex flex-col justify-end min-h-[30px] mr-12">
                  <p className="text-body03 text-secondary-200 mt-auto">{nbread.participant_count}명 참여 중</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
