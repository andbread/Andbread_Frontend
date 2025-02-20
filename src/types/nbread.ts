// TODO) 엔빵 타입 별도 선언 + 테이블 만들어지면 추가로 수정 필요
export interface Nbread {
  id: string
  title: string
  participantCount: number
  amount: number
  paymentAmount: number
  paymentPeriod: 'year' | 'month'
  paymentMonth: number | null
  paymentDate: number | null
}
