/**
 * nbread_records.payment_date 조회 및 갱신에 쓰는 날짜 키(YYYY-MM-DD)를 만든다.
 *
 * 이 값이 한 칸이라도 어긋나면 조회는 0건, 갱신은 0행이 되고 예외는 발생하지 않는다.
 * 즉 납부 체크가 조용히 실패한다. 따라서 변환 규칙을 한 곳에 고정한다.
 */
export const toPaymentDateKey = (startDate: string): string =>
  new Date(startDate).toISOString().split('T')[0]
