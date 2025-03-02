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
  paidCount: number
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
