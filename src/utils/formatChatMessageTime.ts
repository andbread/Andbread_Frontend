export const formatChatMessageTime = (createdAt: string) =>
  new Date(createdAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  })
