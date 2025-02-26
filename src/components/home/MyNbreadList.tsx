interface MyNbreadListProps {
    nbreadList: any[];
  }
  
  const MyNbreadList = ({ nbreadList }: MyNbreadListProps) => {
    return (
      <div className="flex flex-col gap-4 mt-8 mb-12">
        {nbreadList.map((nbread, index) => (
          <div key={index} className="bg-white p-24 rounded-lg shadow flex items-center justify-between">
            <div className="pl-10">
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
    );
  };
  
  export default MyNbreadList;
  