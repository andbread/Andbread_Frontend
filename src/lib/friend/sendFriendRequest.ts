import { apiRequest } from '@/lib/apiClient'
import { sendFriendProps } from '@/components/friend/PlusFriendListItem'
import type { FriendRequestStatus } from '@/lib/server/friend/sendFriendRequest'

export const sendFriendRequest = async ({
  receiverId,
  status,
}: sendFriendProps) => {
  try {
    const result = await apiRequest<FriendRequestStatus[] | null>(
      '/api/friends/requests',
      {
        method: 'POST',
        body: { receiverId, status },
      },
    )

    return result ?? undefined
  } catch (error) {
    // 실패 시 아무 값도 돌려주지 않던 기존 동작을 유지한다.
    console.error('error : ', error)
  }
}
