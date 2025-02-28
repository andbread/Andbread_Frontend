import { data } from './data'

const InviteAcceptTitle = () => {
  return (
      <div>
          <div className="mt-111 mb-20 text-heading02">
        <span>{data.id}</span>님이 당신을
        <br />
        <span className="text-secondary-100">{data.title}</span>으로 초대했어요
      </div>
      <div className='text-gray-400 text-body02 mb-371'>
        엔빵 초대를 수락하고 친구들과<br/> 정기 결제 일정 및 금액을 공유해보세요.
      </div>
    </div>
  )
}

export default InviteAcceptTitle
