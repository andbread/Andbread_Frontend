export function getRelativeTime(utcDateString: string): string {
  const KST_OFFSET = 9 * 60 * 60 * 1000 // 한국은 UTC+9
  const now = new Date(Date.now() + KST_OFFSET)
  const past = new Date(new Date(utcDateString).getTime() + KST_OFFSET)

  const diff = now.getTime() - past.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const month = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
  const year = Math.floor(diff / (1000 * 60 * 60 * 24 * 30 * 12))

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 30) return `${days}일 전`
  if (month < 12) return `${month}개월 전`
  return `${year}년 전`
}
