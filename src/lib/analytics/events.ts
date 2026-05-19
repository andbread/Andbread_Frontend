export const GA_EVENTS = {
  SIGN_IN: 'sign-in',
  LOGOUT: 'logout',
  CREATE_GROUP: 'create_group',
  INVITE_MEMBER: 'invite_member',
  JOIN_GROUP: 'join_group',
  ACCEPT_INVITE: 'accept_invite',
  COMPLETE_PAYMENT: 'complete_payment',
  ADD_FRIEND: 'add_friend',
  SEARCH_FRIEND: 'search_friend',
  ACCEPT_FRIEND: 'accept_friend',
  RECEIVE_NOTIFICATION: 'receive_notification',
  CLICK_NOTIFICATION: 'click_notification',
  CHANGE_NOTIFICATION_SETTING: 'change_notification_setting',
  VIEW_PAGE: 'view_page',
} as const

type EventParams = Record<string, string | number | boolean | null | undefined>

export const trackEvent = (
  eventName: (typeof GA_EVENTS)[keyof typeof GA_EVENTS],
  params?: EventParams,
) => {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params ?? {})
}
