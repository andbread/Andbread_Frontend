import { apiRequest } from '@/lib/apiClient'

export const updateAcceptFriend = async (
  receiverId: string,
  senderId: string | null,
) => {
  try {
    await apiRequest('/api/friends/requests', {
      method: 'PATCH',
      body: { senderId, status: 'accepted' },
    })

    // 기존에도 insert 결과가 null이라 항상 null을 돌려줬다.
    return null
  } catch (error) {
    console.error('친구 수락 업데이트 실패!', error)
    return null
  }
}

export const updateRejectedFriend = async (
  receiverId: string,
  senderId: string | null,
) => {
  try {
    await apiRequest('/api/friends/requests', {
      method: 'PATCH',
      body: { senderId, status: 'rejected' },
    })
  } catch (error) {
    console.error('친구 거절 업데이트 실패!', error)
  }
}
