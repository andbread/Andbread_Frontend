import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const secretKeysJson = Deno.env.get('SUPABASE_SECRET_KEYS')

if (!supabaseUrl || !secretKeysJson) {
  throw new Error('Supabase Edge Function 환경 변수가 설정되지 않았습니다.')
}

let secretKeys: unknown

try {
  secretKeys = JSON.parse(secretKeysJson)
} catch {
  throw new Error('SUPABASE_SECRET_KEYS 형식이 올바르지 않습니다.')
}

const secretKey =
  typeof secretKeys === 'object' && secretKeys !== null
    ? (secretKeys as Record<string, unknown>).default
    : null

if (typeof secretKey !== 'string' || !secretKey.startsWith('sb_secret_')) {
  throw new Error('기본 Supabase secret key가 설정되지 않았습니다.')
}

const fetchWithApiKeyOnly: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers)

  headers.delete('Authorization')

  return fetch(input, { ...init, headers })
}

export const supabaseClient = createClient(supabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithApiKeyOnly,
  },
})
