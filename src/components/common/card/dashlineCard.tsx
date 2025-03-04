'use client'
import Icon, { IconType } from '../icon/icon'
import { useEffect, useState } from 'react'
import { getNbread } from '@/lib/nbread'

interface DashlineCardProps {
  text: string
  tailwindColor: string
  iconType: IconType
  size: number
  nbreadId: string
  onClick?: () => void
}

const DashlineCard = ({
  text,
  tailwindColor,
  iconType,
  size,
  nbreadId,
  onClick,
}: DashlineCardProps) => {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [leaderId, setLeaderId] = useState<string | undefined>(undefined);
  const [isLeader, setIsLeader] = useState<boolean>(false);

  // 첫 번째 useEffect: 세션에서 유저 데이터 가져오기
  useEffect(() => {
    const user = sessionStorage.getItem('user-store');
    if (user) {
      try {
        // 데이터를 JSON으로 파싱합니다
        const parsedData = JSON.parse(user);
        
        // 파싱된 데이터에서 userId를 추출합니다
        const extractedUserId = parsedData.state.user.id;
        
        setUserId(extractedUserId);  // userId 상태에 저장
        console.log("userId : ", extractedUserId)
      } catch (error) {
        console.error('Error parsing sessionStorage data', error);
      }
    }
  }, []);  // userId만 필요하므로 의존성 배열은 빈 배열로 설정

  // 두 번째 useEffect: nbreadId에 따른 리더 ID 가져오기
  useEffect(() => {
    const fetchData = async () => {
      if (userId) {  // userId가 있을 때만 실행
        const nbreadDetails = await getNbread(nbreadId);
        const fetchedLeaderId = nbreadDetails.leaderId;
        setLeaderId(fetchedLeaderId as string);
        console.log("leaderId : ", fetchedLeaderId);
        
        // 리더 ID와 유저 ID 비교
        if (fetchedLeaderId === userId) {
          setIsLeader(true);
        } else {
          setIsLeader(false);
        }
      }
    };
    
    fetchData();
  }, [userId, nbreadId]);  // userId와 nbreadId가 변경될 때마다 실행

  return (
    <div
      className="card-dashline mb-1 flex flex-row items-center justify-center gap-8 px-32 py-26"
      onClick={onClick}
    >
      <Icon type={iconType} width={size} height={size} fill={tailwindColor} />
      <div className="text-body02">{text}</div>
    </div>
  )
}

export default DashlineCard;
