import { loadEnvConfig } from '@next/env'

// Playwright는 Next.js와 달리 .env 파일을 자동으로 읽지 않으므로 같은 방식으로 직접 불러온다.
loadEnvConfig(process.cwd(), true, {
  info: () => {},
  error: () => {},
})

/**
 * 앱이 쓰는 Supabase 설정을 그대로 사용한다. 운영과 분리된 개발 프로젝트를 가리킨다.
 * service role key는 seed와 cleanup에만 쓰고 브라우저 코드로 넘기지 않는다.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

// seed와 cleanup이 service role key로 사용자와 그룹을 만들고 지우므로,
// .env.local 설정 실수로 운영 DB를 가리키면 데이터를 건드리기 전에 멈춘다.
const PRODUCTION_PROJECT_REF = 'yyisakaqnaoomehqlyjz'

if (supabaseUrl.includes(PRODUCTION_PROJECT_REF)) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL이 운영 Supabase 프로젝트를 가리킵니다. 테스트는 개발 프로젝트에서만 실행합니다.',
  )
}
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
export const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  '') as string

/** 테스트가 만들고 지우는 계정에만 쓰는 비밀번호. 저장소에 값을 두지 않는다. */
export const testUserPassword = process.env.E2E_TEST_USER_PASSWORD ?? ''

export const hasTestDatabase = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey && testUserPassword,
)

export const testDatabaseSkipReason =
  'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_USER_PASSWORD가 없어 데이터가 필요한 케이스를 건너뜁니다.'
