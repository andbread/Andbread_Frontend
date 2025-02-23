"use client"

import Avatar from '../../components/common/avatar/avatar';

interface MyInfoProps {
  profileImageUrl: string; 
}

const MyInfo = ({ profileImageUrl }: MyInfoProps) => {
  return (
    <div className="card mt-12">
      <div className="flex items-center justify-between mr-12">
        <div>
        <Avatar
          profileImageUrl={profileImageUrl}
          size="large"
        />
        </div>
        <div className='flex-shrink-0 justify-between mr-225 ml-12'>
          <p className="font-bold mb-5 text-heading05 text-gray-800">신혜민</p>
          <p className="text-body04 text-gray-600 whitespace-nowrap">카카오 계정 
            <span className="text-body04 text-gray-400 ml-12 mr-36 whitespace-nowrap"> asdf1234@naver.com</span>
          </p> 
        </div>
      </div>
    </div>
  );
}

export default MyInfo;
