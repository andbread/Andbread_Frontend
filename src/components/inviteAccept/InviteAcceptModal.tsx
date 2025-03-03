'use client';
import Modal from '../common/modal/Modal';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // useRouter 훅을 가져옵니다.
import { getUser } from '@/lib/auth';
import useUserStore from '@/stores/useAuthStore';
import { insertParticipant } from '@/lib/participant';
interface InviteAcceptProps {
  isOpen: boolean;
  onClose: () => void;
  
}

const InviteAcceptModal = ({ isOpen, onClose }: InviteAcceptProps) => {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const setUser = useUserStore((state) => state.setUser)
  const [inviteAcceptModalData, setInviteAcceptModalData] = useState<{
    title: string;
    subTitle: string;
    buttonTitle: string;
  }>({
    title: '',
    subTitle: '',
    buttonTitle: '',
  });

  const router = useRouter(); // useRouter 훅을 사용하여 라우터를 가져옵니다.

  const inviteAcceptData = {
    login: {
      title: '먼저 로그인이 필요해요.',
      subTitle: '엔빵에 참여하려면 로그인을 해야 해요.',
      buttonTitle: '로그인하러 가기',
    },
    completed: {
      title: '엔빵 참여가 완료되었어요.',
      subTitle: '참여한 엔빵 정보를 바로 확인할 수 있어요.',
      buttonTitle: '엔빵확인하러 가기',
    },
    expired: {
      title: '엔빵 초대가 만료되었어요.',
      subTitle: '링크가 만료되어 초대를 수락할 수 없어요.',
      buttonTitle: '홈으로 가기',
    },
  };

  useEffect(() => {
    
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      // 로그인 상태가 아니면 로그인 페이지로 라우트
      setInviteAcceptModalData(inviteAcceptData.login);
      
    } else {
      setInviteAcceptModalData(inviteAcceptData.completed);
      const fetchData = async () => {
        const data = await getUser(accessToken);
        console.log("user : ",data);
        
        if (data.data.user) {
          const provider = data.data.user.app_metadata.provider as 'kakao' | 'google'

          const userInfo = {
            id: data.data.user.id,
            email: data.data.user.email || '',
            socialType: provider,
            name: data.data.user.user_metadata.full_name || '',
            profileImage: data.data.user.user_metadata.avatar_url || '',
          }
          setUser(userInfo)
          const user = {
           user: userInfo,isLeader: false
          }
          setGroupId(sessionStorage.getItem('group_id'))
          if(groupId){

            const data = await insertParticipant(user,groupId)
            console.log(data);
          }
      }
    }
      fetchData();
    }
  }, [isOpen]);

  const handleLoginRedirect = () => {
    router.replace('/login'); 
  };
  const handleCompleteRedirect = () => {
    router.replace('/home'); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col">
        <div className="pl-15">
          <p className="text-heading05 text-gray-800 mb-10">
            {inviteAcceptModalData.title}
          </p>
          <p className="text-body02 text-gray-800 mb-15">
            {inviteAcceptModalData.subTitle}
          </p>
        </div>
      </div>
      <button
        onClick={ inviteAcceptModalData.buttonTitle === '로그인하러 가기'
          ? handleLoginRedirect
          : inviteAcceptModalData.buttonTitle === '엔빵확인하러 가기'
          ? handleCompleteRedirect
          : onClose} className="text-lg m-16 h-[48px] w-[232px] rounded-md bg-[#FFAC39] p-12 font-semibold text-white"
      >
        {inviteAcceptModalData.buttonTitle}
      </button>
    </Modal>
  );
};

export default InviteAcceptModal;
