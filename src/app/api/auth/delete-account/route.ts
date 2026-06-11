import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_KEY
const supabaseSecretKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

const authSupabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null

const adminSupabase =
  supabaseUrl && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null

export async function POST(request: Request) {
  if (!authSupabase || !adminSupabase) {
    return NextResponse.json(
      { message: 'Supabase 서버 환경 변수가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!accessToken) {
    return NextResponse.json(
      { message: '인증 토큰이 없습니다.' },
      { status: 401 },
    )
  }

  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser(accessToken)

  if (userError || !user) {
    return NextResponse.json(
      { message: '유효하지 않은 인증 토큰입니다.' },
      { status: 401 },
    )
  }

  const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(
    user.id,
  )

  if (deleteError) {
    captureAppError(deleteError, {
      action: 'auth.delete_account.api',
      tags: { userId: user.id },
    })

    return NextResponse.json(
      { message: '회원 탈퇴에 실패했습니다.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
