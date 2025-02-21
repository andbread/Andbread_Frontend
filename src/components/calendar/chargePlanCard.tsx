"use client"

import Avatar from '../../components/common/avatar/avatar';

interface ChargePlanCardProps {
  profileImageUrl: string; 
}

const ChargePlanCard = ({ profileImageUrl }: ChargePlanCardProps) => {
  return (
    <div className="card ml-[24px] mr-[24px] mt-[24px]">
      <div className="flex items-center justify-between">
        <div className="text-body02 mr-[59px]">유튜브 프리미엄</div>
        <Avatar
          profileImageUrl={profileImageUrl}
          size="large"
        />
      </div>
      <div className="flex mt-[4px] justify-between">
        <div className="text-body05 text-gray-500 flex">
          5,800원 / 매년
        </div>
        <div className="text-body06 text-secondary-300 flex">
          미완료 3 / 4
        </div>
      </div>
    </div>
  );
}

export default ChargePlanCard;
