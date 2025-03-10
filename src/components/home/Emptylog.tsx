interface EmptyLogProps {
  message?: string
}

const EmptyLog = ({ message = '등록된 엔빵이 없어요 🍞' }: EmptyLogProps) => {
  return (
    <div className="card flex flex-col gap-8 bg-gray-200 p-24">
      <p className="text-body02 text-gray-600">{message}</p>
      <h3 className="text-gray-700">엔빵을 추가해보세요!</h3>
    </div>
  )
}

export default EmptyLog
