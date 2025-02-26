import NbreadList from "@/components/home/NbreadList";
import Emptylog from "@/components/home/Emptylog";

interface MonthlyNbreadProps {
  nbreadList: any[];
  totalAmount: number;
  currentMonth: number;
  profileImageUrl: string;
}

const MonthlyNbread = ({ nbreadList, totalAmount, currentMonth, profileImageUrl }: MonthlyNbreadProps) => {
  return (
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
          <NbreadList nbreadList={nbreadList} profileImageUrl={profileImageUrl} />
        </>
      ) : (
        <Emptylog />
      )}
    </section>
  );
};

export default MonthlyNbread;
