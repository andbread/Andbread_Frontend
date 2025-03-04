import { User } from '@/types/user'
export interface Nbread {
  id: string
  title: string
  participantCount: number
  amount: number
  paymentAmount?: number
  paymentPeriod: 'year' | 'month'
  paymentMonth: number | null
  paymentDate: number | null
  leaderId: string | null
  participants: Participant[] | null
  currentPaymentDate: string | null
  paidCount?: number
}

export interface Participant {
  user: User
  isLeader: boolean
}

export interface NbreadRecord {
  userId: string
  nbreadId: string
  paymentDate: string
  isPaid: boolean
}
export interface NbreadInvite {
  leaderId: string;            // 초대 링크를 생성한 리더의 ID
  link: string;                // 실제 초대 링크
  maxUsers: number;            // 초대할 수 있는 최대 사용자 수
  currentUsers: number;        // 현재까지 초대된 사용자 수
  expirationDate: string;      // 초대 링크의 만료일 (ISO 8601 형식, 예: "2025-12-31T23:59:59Z")
  status: 'active' | 'expired' | 'used'; // 초대 링크의 상태 (활성화, 만료, 사용됨)
  createdAt: string;          
  updatedAt: string;           
}