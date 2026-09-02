/**
 * 총 금액을 참여 인원으로 나눈 1인당 정산 금액을 계산한다.
 *
 * 원 단위 미만은 버린다. 참여 인원이 0 이하이거나 숫자가 아니면 1명으로 취급해
 * 0 나눗셈으로 Infinity 가 화면에 노출되는 것을 막는다.
 */
export const calculateIndividualShare = (
  amount: number,
  participantCount: number,
): number => {
  const safeParticipantCount = Math.max(Math.trunc(participantCount) || 1, 1)
  const share = Math.floor(amount / safeParticipantCount)

  return Number.isFinite(share) ? share : 0
}
