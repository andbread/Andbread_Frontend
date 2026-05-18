export const runtime = 'nodejs'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
const SENTRY_WEBHOOK_SECRET = process.env.SENTRY_WEBHOOK_SECRET
// 같은 이슈가 짧은 시간에 반복 전송되는 것을 막기 위한 인메모리 캐시입니다.
const DUPLICATE_TTL_MS = 10 * 60 * 1000
const duplicateCache = new Map<string, number>()

type JsonRecord = Record<string, unknown>

type DiscordField = {
  name: string
  value: string
  inline?: boolean
}

type ExtractedSentryEvent = {
  project: string
  level: string
  environment: string
  release?: string
  issueId?: string
  shortId?: string
  issueUrl?: string
  eventId?: string
  title: string
  culprit?: string
  topFrame?: string
  errorUrl?: string
  device?: string
  browser?: string
  os?: string
  transaction?: string
  count?: string
  userCount?: string
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function ellipsis(value: unknown, max = 300) {
  const text = sanitize(String(value ?? ''))
  return text.length > max ? `${text.slice(0, max - 1)}...` : text
}

function sanitize(value: string) {
  // Discord로 전달되기 전 이메일, 토큰, 인증값 등 민감 정보를 제거합니다.
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(
      /((?:token|access_token|refresh_token|auth|authorization|api[_-]?key|secret|password)=)[^&\s]+/gi,
      '$1[redacted]',
    )
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
}

function colorByLevel(level: string) {
  switch (level.toLowerCase()) {
    case 'fatal':
      return 0x8e44ad
    case 'error':
      return 0xe74c3c
    default:
      return 0x95a5a6
  }
}

function isReportableLevel(level: string) {
  return ['fatal', 'error'].includes(level.toLowerCase())
}

function safeUrl(value: unknown) {
  const url = asString(value)
  if (!url) return undefined

  try {
    const parsed = new URL(url)
    // URL query에 섞일 수 있는 민감 파라미터만 마스킹합니다.
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (/token|auth|key|secret|password|email/i.test(key)) {
        parsed.searchParams.set(key, '[redacted]')
      }
    }
    return parsed.toString()
  } catch {
    return sanitize(url)
  }
}

function getTag(event: JsonRecord, key: string) {
  const tags = event.tags
  if (Array.isArray(tags)) {
    const tag = tags.find((item) => Array.isArray(item) && item[0] === key)
    return Array.isArray(tag) ? asString(tag[1]) : undefined
  }

  return asString(asRecord(tags)[key])
}

function pickTopFrame(event: JsonRecord) {
  const entries = Array.isArray(event.entries)
    ? event.entries.map(asRecord)
    : []
  const exceptionEntry = entries.find((entry) => entry.type === 'exception')
  const entryData = asRecord(exceptionEntry?.data)
  const exception = asRecord(event.exception)
  const values = Array.isArray(entryData.values)
    ? entryData.values.map(asRecord)
    : Array.isArray(exception.values)
      ? exception.values.map(asRecord)
      : []
  const targetException = values[values.length - 1] ?? values[0]
  const stacktrace = asRecord(targetException?.stacktrace)
  const frames = Array.isArray(stacktrace.frames)
    ? stacktrace.frames.map(asRecord)
    : []
  const frame =
    // 앱 코드에서 발생한 프레임을 우선 사용하고, 없으면 마지막 프레임을 사용합니다.
    [...frames].reverse().find((item) => item.in_app === true) ??
    frames[frames.length - 1]

  if (!frame) return undefined

  const filename =
    asString(frame.filename) ?? asString(frame.abs_path) ?? 'unknown'
  const line = frame.lineno ? `:${String(frame.lineno)}` : ''
  const fn = asString(frame.function) ?? 'anonymous'

  return `${filename}${line} - ${fn}`
}

function extractDeviceInfo(event: JsonRecord) {
  const contexts = asRecord(event.contexts)
  const device = asRecord(contexts.device)
  const browser = asRecord(contexts.browser)
  const os = asRecord(contexts.os)

  const deviceName = [
    asString(device.family) ?? asString(device.model),
    asString(device.brand),
    asString(device.arch),
  ]
    .filter(Boolean)
    .join(' ')

  const browserName = [asString(browser.name), asString(browser.version)]
    .filter(Boolean)
    .join(' ')
  const osName = [asString(os.name), asString(os.version)]
    .filter(Boolean)
    .join(' ')

  return {
    device: deviceName || undefined,
    browser: browserName || undefined,
    os: osName || undefined,
  }
}

function extract(body: unknown): ExtractedSentryEvent {
  // Sentry webhook payload는 설정에 따라 issue/event 위치가 달라질 수 있어 둘 다 대응합니다.
  const root = asRecord(body)
  const data = asRecord(root.data)
  const issue = asRecord(data.issue ?? root.issue)
  const event = asRecord(data.event ?? root.event)
  const request = asRecord(event.request)
  const contexts = asRecord(event.contexts)
  const app = asRecord(contexts.app)
  const deviceInfo = extractDeviceInfo(event)

  const project =
    asString(asRecord(issue.project).name) ??
    asString(event.project) ??
    asString(root.project) ??
    'unknown'
  const level = (
    asString(event.level) ??
    asString(issue.level) ??
    'error'
  ).toLowerCase()
  const environment =
    asString(event.environment) ??
    asString(issue.environment) ??
    asString(data.environment) ??
    'unknown'
  const title =
    asString(event.message) ??
    asString(issue.title) ??
    asString(root.message) ??
    'Unknown Sentry error'

  return {
    project,
    level,
    environment,
    release:
      asString(event.release) ??
      asString(app.version) ??
      asString(asRecord(issue.firstRelease).version),
    issueId: asString(issue.id),
    shortId: asString(issue.shortId),
    issueUrl: safeUrl(issue.url ?? root.url),
    eventId: asString(event.event_id),
    title,
    culprit: asString(event.culprit) ?? asString(issue.culprit),
    topFrame: pickTopFrame(event),
    errorUrl: safeUrl(request.url) ?? safeUrl(getTag(event, 'url')),
    transaction: asString(event.transaction) ?? getTag(event, 'transaction'),
    count: issue.count ? String(issue.count) : undefined,
    userCount: issue.userCount ? String(issue.userCount) : undefined,
    ...deviceInfo,
  }
}

function getDuplicateKey(event: ExtractedSentryEvent) {
  if (event.issueId) {
    return [event.issueId, event.release, event.environment]
      .filter(Boolean)
      .join(':')
  }

  return [event.title, event.culprit, event.release, event.environment]
    .filter(Boolean)
    .join(':')
}

function isDuplicate(event: ExtractedSentryEvent) {
  const now = Date.now()

  // 만료된 중복 키를 요청 시점에 정리합니다.
  for (const [key, expiresAt] of duplicateCache.entries()) {
    if (expiresAt <= now) duplicateCache.delete(key)
  }

  const key = getDuplicateKey(event)
  if (!key) return false
  if (duplicateCache.has(key)) return true

  duplicateCache.set(key, now + DUPLICATE_TTL_MS)
  return false
}

function buildDiscordPayload(event: ExtractedSentryEvent) {
  // Discord Embed 제한을 고려해 필드별로 길이를 줄여 전송합니다.
  const fields = [
    {
      name: 'Environment',
      value: `\`${ellipsis(event.environment, 60)}\``,
      inline: true,
    },
    event.release && {
      name: 'Release',
      value: `\`${ellipsis(event.release, 80)}\``,
      inline: true,
    },
    event.shortId && {
      name: 'Issue',
      value: event.issueUrl
        ? `[${ellipsis(event.shortId, 60)}](${event.issueUrl})`
        : `\`${ellipsis(event.shortId, 60)}\``,
      inline: true,
    },
    event.errorUrl && {
      name: 'URL',
      value: ellipsis(event.errorUrl, 250),
      inline: false,
    },
    event.transaction && {
      name: 'Transaction',
      value: `\`${ellipsis(event.transaction, 120)}\``,
      inline: false,
    },
    event.topFrame && {
      name: 'Top Frame',
      value: `\`${ellipsis(event.topFrame, 250)}\``,
      inline: false,
    },
    event.device && {
      name: 'Device',
      value: `\`${ellipsis(event.device, 80)}\``,
      inline: true,
    },
    event.browser && {
      name: 'Browser',
      value: `\`${ellipsis(event.browser, 80)}\``,
      inline: true,
    },
    event.os && {
      name: 'OS',
      value: `\`${ellipsis(event.os, 80)}\``,
      inline: true,
    },
    event.count && {
      name: 'Events',
      value: `\`${event.count}\``,
      inline: true,
    },
    event.userCount && {
      name: 'Users',
      value: `\`${event.userCount}\``,
      inline: true,
    },
  ].filter(Boolean) as DiscordField[]

  return {
    username: 'Sentry Alert',
    embeds: [
      {
        title: `[${event.project}] ${ellipsis(event.title, 220)}`,
        url: event.issueUrl,
        description: event.culprit
          ? `Culprit: \`${ellipsis(event.culprit, 250)}\``
          : undefined,
        color: colorByLevel(event.level),
        timestamp: new Date().toISOString(),
        footer: {
          text: `Sentry ${event.level.toUpperCase()} alert`,
        },
        fields,
      },
    ],
  }
}

async function postToDiscord(payload: unknown) {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error('DISCORD_WEBHOOK_URL is not set')
  }

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`Discord webhook failed: ${response.status} ${message}`)
  }
}

function isAuthorized(request: Request) {
  if (!SENTRY_WEBHOOK_SECRET) return true

  // Sentry webhook에서 전달한 secret이 있을 때만 요청을 허용합니다.
  const token =
    request.headers.get('x-sentry-webhook-secret') ??
    request.headers.get('x-webhook-secret') ??
    new URL(request.url).searchParams.get('secret')

  return token === SENTRY_WEBHOOK_SECRET
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json(
        { ok: false, reason: 'unauthorized' },
        { status: 401 },
      )
    }

    const event = extract(await request.json())

    // 운영 환경 에러만 알림으로 전송합니다.
    if (event.environment.toLowerCase() !== 'production') {
      return Response.json({ ok: true, skipped: 'non-production' })
    }

    // warning 이하 레벨은 알림 스팸 방지를 위해 제외합니다.
    if (!isReportableLevel(event.level)) {
      return Response.json({ ok: true, skipped: 'non-error-level' })
    }

    // 동일 이슈의 반복 알림을 일정 시간 동안 억제합니다.
    if (isDuplicate(event)) {
      return Response.json({ ok: true, skipped: 'duplicate' })
    }

    await postToDiscord(buildDiscordPayload(event))

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Sentry webhook failed:', error)
    return Response.json({ ok: false }, { status: 500 })
  }
}
