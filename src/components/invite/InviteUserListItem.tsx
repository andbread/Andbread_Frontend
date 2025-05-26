import DefaultAvatar from '@/assets/avatar.svg'
interface InviteUserData {
    avatar : string
    name : string
    status : string
}
const InviteUserListItem = ({avatar,name,status} : InviteUserData) => {
    const getInviteUserStatus = (status : string) => {
        switch (status) {
            case '초대 하기':
              return { color: 'text-system-blue01', cursor: 'cursor-pointer' };
            case '참여 중':
              return { color: 'text-gray-400', cursor: null };
            case '초대 완료':
              return { color: 'text-gray-400', cursor: null };
            default:
              return { color: 'text-black', cursor: 'cursor-pointer' };
          }   
        };
        const {color,cursor} = getInviteUserStatus(status);

        const handleClick = (status : string) => {
            if(status == '초대 하기'){
                console.log('초대 보냄');
            }
        }
  return (
    <div className="flex w-full flex-row pb-[30px]">
      <div className="flex flex-row items-center w-[40%] gap-[20px]">
        <DefaultAvatar />
        <p className="text-body01">{name}</p>
      </div>
      <div className='flex items-center w-[60%] justify-end'>
        <p className={`${color} text-body01 ${cursor}`}
        onClick={() => handleClick(status)}>{status}</p>
      </div>
    </div>
  )
}
export default InviteUserListItem
