import { describe, expect, it, test } from 'vitest'
import {
  getNotificationDestination,
  getNotificationDestinationError,
} from './getNotificationDestination'
import type { Notification, NotificationType } from '@/types/notification'

const notification = (
  type: NotificationType,
  data: Notification['data'] = null,
): Pick<Notification, 'type' | 'data'> => ({ type, data })

// 엔빵 아이디가 있어야 이동 경로가 만들어지는 알림 타입
const nbreadIdRequiredTypes: { type: NotificationType }[] = [
  { type: 'chat' },
  { type: 'payment' },
  { type: 'invite_accept' },
]

// data 에서 값을 읽어야 이동 경로가 만들어지는 알림 타입
const dataRequiredTypes: { type: NotificationType }[] = [
  ...nbreadIdRequiredTypes,
  { type: 'invite' },
]

describe('getNotificationDestination', () => {
  describe('초대 알림', () => {
    it('camelCase 키에서 초대 토큰을 읽는다', () => {
      expect(
        getNotificationDestination(
          notification('invite', { inviteToken: 'abc123' }),
        ),
      ).toBe('/invite/abc123')
    })

    it('snake_case 키에서도 초대 토큰을 읽는다', () => {
      expect(
        getNotificationDestination(
          notification('invite', { invite_token: 'abc123' }),
        ),
      ).toBe('/invite/abc123')
    })

    it('토큰에 URL 예약 문자가 있으면 인코딩한다', () => {
      expect(
        getNotificationDestination(
          notification('invite', { inviteToken: 'a/b c' }),
        ),
      ).toBe('/invite/a%2Fb%20c')
    })

    it('토큰이 없으면 null 을 반환한다', () => {
      expect(
        getNotificationDestination(notification('invite', { nbreadId: 'n1' })),
      ).toBeNull()
    })
  })

  describe('엔빵 알림', () => {
    it('채팅 알림은 chat 탭으로 보낸다', () => {
      expect(
        getNotificationDestination(notification('chat', { nbreadId: 'n1' })),
      ).toBe('/nbread/n1?tab=chat')
    })

    it('납부 알림은 엔빵 상세로 보낸다', () => {
      expect(
        getNotificationDestination(notification('payment', { nbread_id: 'n1' })),
      ).toBe('/nbread/n1')
    })

    it('초대 수락 알림은 엔빵 상세로 보낸다', () => {
      expect(
        getNotificationDestination(
          notification('invite_accept', { nbreadId: 'n1' }),
        ),
      ).toBe('/nbread/n1')
    })

    test.for(nbreadIdRequiredTypes)(
      '$type 알림은 엔빵 아이디가 없으면 null 을 반환한다',
      ({ type }) => {
        expect(getNotificationDestination(notification(type, {}))).toBeNull()
      },
    )
  })

  describe('친구 알림', () => {
    it('친구 응답 알림은 data 없이도 친구 목록으로 보낸다', () => {
      expect(getNotificationDestination(notification('friend_response'))).toBe(
        '/friendList',
      )
    })

    it('친구 요청 알림은 이동 경로가 없다', () => {
      expect(
        getNotificationDestination(notification('friend_request')),
      ).toBeNull()
    })
  })

  describe('잘못된 data', () => {
    test.for(dataRequiredTypes)(
      '$type 알림은 data 가 null 이면 null 을 반환한다',
      ({ type }) => {
        expect(getNotificationDestination(notification(type, null))).toBeNull()
      },
    )

    it('data 가 배열이면 null 을 반환한다', () => {
      expect(
        getNotificationDestination(notification('chat', ['n1'])),
      ).toBeNull()
    })

    it('값이 빈 문자열이면 없는 것으로 취급한다', () => {
      expect(
        getNotificationDestination(notification('chat', { nbreadId: '' })),
      ).toBeNull()
    })

    it('값이 문자열이 아니면 없는 것으로 취급한다', () => {
      expect(
        getNotificationDestination(notification('chat', { nbreadId: 123 })),
      ).toBeNull()
    })

    it('camelCase 키가 비어 있으면 snake_case 키로 넘어간다', () => {
      expect(
        getNotificationDestination(
          notification('chat', { nbreadId: '', nbread_id: 'n1' }),
        ),
      ).toBe('/nbread/n1?tab=chat')
    })
  })
})

describe('getNotificationDestinationError', () => {
  it('초대 알림은 초대 정보 안내 문구를 반환한다', () => {
    expect(getNotificationDestinationError('invite')).toBe(
      '초대 정보를 찾을 수 없어요.',
    )
  })

  it('친구 요청 알림은 이동할 곳이 없으므로 문구가 없다', () => {
    expect(getNotificationDestinationError('friend_request')).toBe('')
  })

  it('나머지 알림은 공통 안내 문구를 반환한다', () => {
    expect(getNotificationDestinationError('chat')).toBe(
      '이동할 페이지 정보를 찾을 수 없어요.',
    )
  })
})
