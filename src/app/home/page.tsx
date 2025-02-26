"use client";
import { useEffect, useState } from "react";
import { getUserNbreads } from "@/lib/nbread/getUserNbread";
import Header from "@/components/home/Header";
import MonthlyNbread from "@/components/home/MonthlyNbread";
import MyNbread from "@/components/home/MyNbread";

const HomePage = () => {
  const [nbreadList, setNbreadList] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);

  useEffect(() => {
    const userStore = sessionStorage.getItem("user-store");
    if (userStore) {
      const userData = JSON.parse(userStore).state?.user;
      if (userData?.id) {
        setUserId(userData.id);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchNbreads = async () => {
      const nbreads = await getUserNbreads(userId);
      setNbreadList(nbreads);
      const total = nbreads.reduce(
        (sum, nbread) => sum + Math.floor(nbread.amount / Math.max(nbread.participant_count, 1)),
        0
      );
      setTotalAmount(total);
    };
    fetchNbreads();
  }, [userId]);

  return (
    <div className="flex flex-col justify-between p-24 pt-16">
      <Header />
      <main className="p-4 mt-24">
        <MonthlyNbread nbreadList={nbreadList} totalAmount={totalAmount} currentMonth={currentMonth} />
        <MyNbread nbreadList={nbreadList} />
      </main>
    </div>
  );
};

export default HomePage;
