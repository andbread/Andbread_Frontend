'use client'
import ChargePlanCard from "@/components/calendar/chargePlanCard";
import Calendar from "@/components/calendar/calendar";
import DetailHeader from "@/components/common/header/detailHeader";

const Page = () => {
  return (
    <main className="flex h-full flex-col">
      <section className="bg-white pl-[24px]">
        <DetailHeader></DetailHeader>
      </section>
        <Calendar />
        <ChargePlanCard />
    </main>

  );
};

export default Page;
