import Avatar from "@/components/common/avatar/avatar";

interface NbreadCardProps {
  nbread: any;
  profileImageUrl: string; 
}

const NbreadCard = ({ nbread, profileImageUrl }: NbreadCardProps) => {
  return (
    <div className="bg-white p-24 rounded-lg shadow flex items-center justify-between">
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
            <div key={idx} className="relative -ml-6">
              <Avatar size="large" profileImageUrl={profileImageUrl} />
            </div>
          ))}
        </div>
        {/* 참여 인원 상태 */}
        <p className="text-body04 text-secondary-300">미완료 0/{nbread.participant_count}</p>
      </div>
    </div>
  );
};

export default NbreadCard;
