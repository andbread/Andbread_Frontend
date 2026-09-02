// 검증 게이트 동작 확인용 임시 파일입니다. 확인 후 되돌립니다.
import { calculateIndividualShare } from '@/lib/nbread/calculateIndividualShare'

export const brokenOnPurpose = calculateIndividualShare('30000', 3)
