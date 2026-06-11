import * as Sentry from '@sentry/nextjs'
import type { ErrorEvent, Event, EventHint, User } from '@sentry/nextjs'

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|email|fcm|firebase|kakao|password|phone|private|refresh|secret|token|vapid)/i

const SENSITIVE_REPLACEMENT = '[Filtered]'

const redactUrl = (value: string) => {
  try {
    const url = new URL(value)

    url.searchParams.forEach((_, key) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        url.searchParams.set(key, SENSITIVE_REPLACEMENT)
      }
    })

    return url.toString()
  } catch {
    return value
  }
}

const sanitizeValue = (
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown => {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'string') {
    return redactUrl(value)
  }

  if (typeof value !== 'object') {
    return value
  }

  if (seen.has(value)) {
    return '[Circular]'
  }

  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen))
  }

  return Object.entries(value).reduce<Record<string, unknown>>(
    (result, [key, item]) => {
      result[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? SENSITIVE_REPLACEMENT
        : sanitizeValue(item, seen)
      return result
    },
    {},
  )
}

export const beforeSend = (event: ErrorEvent, _hint: EventHint) => {
  if (event.user) {
    event.user = { id: event.user.id }
  }

  if (event.request) {
    event.request.cookies = undefined
    event.request.headers = sanitizeValue(event.request.headers) as Record<
      string,
      string
    >
    event.request.query_string = sanitizeValue(event.request.query_string) as
      | string
      | Record<string, string>
      | undefined
    event.request.url = event.request.url
      ? redactUrl(event.request.url)
      : event.request.url
  }

  event.extra = sanitizeValue(event.extra) as Event['extra']
  event.contexts = sanitizeValue(event.contexts) as Event['contexts']

  return event
}

export const setSentryUser = (user: Pick<User, 'id'> | null) => {
  Sentry.setUser(user?.id ? { id: user.id } : null)
}

export const captureAppError = (
  error: unknown,
  context: {
    action: string
    level?: Sentry.SeverityLevel
    tags?: Record<string, string | number | boolean | undefined>
    extra?: Record<string, unknown>
  },
) => {
  Sentry.withScope((scope) => {
    scope.setTag('action', context.action)

    Object.entries(context.tags ?? {}).forEach(([key, value]) => {
      if (value !== undefined) {
        scope.setTag(key, String(value))
      }
    })

    if (context.extra) {
      scope.setExtras(sanitizeValue(context.extra) as Record<string, unknown>)
    }

    if (context.level) {
      scope.setLevel(context.level)
    }

    Sentry.captureException(error)
  })
}
