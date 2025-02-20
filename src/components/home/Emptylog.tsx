interface EmptyLogProps {
    message?: string; 
  }
  
  const EmptyLog = ({ message = "등록된 엔빵이 없어요 🍞" }: EmptyLogProps) => {
    return (
      <div className="bg-gray-300 p-4 py-36 rounded-xl shadow-md">
        <p className="text-[12px] text-gray-900 ml-48">{message}</p>
        <p className="text-[16px] font-bold mt-10 ml-48">엔빵을 추가해보세요!</p>
      </div>
    );
  };
  
  export default EmptyLog;
  