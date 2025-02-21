import { User } from '@/types/user'
export interface Nbread {
  id: string
  title: string
  participantCount: number
  amount: number
  paymentAmount: number
  paymentPeriod: 'year' | 'month'
  paymentMonth: number | null
  paymentDate: number | null
  leaderId: string | null
  participants: Participant[] | null
}

export interface Participant {
  user: User
  isLeader: boolean
}

export interface LoginProvider {
  provider: 'kakao' | 'google'
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}
