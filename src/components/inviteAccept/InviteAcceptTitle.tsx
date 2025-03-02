const InviteAcceptTitle = () => {
  const data = {
    id: '신혜민',
    title: '유튜브 프리미엄',
  }
  return (
    <div>
      <div className="mb-20 mt-72 text-heading02">
        <span>{data.id}</span>님이 당신을
        <br />
        <span className="text-secondary-100">{data.title}</span>으로 초대했어요
      </div>
      <div className="text-body02 text-gray-400">
        엔빵 초대를 수락하고 친구들과
        <br /> 정기 결제 일정 및 금액을 공유해보세요.
      </div>
    </div>
  )
}

export default InviteAcceptTitle
