import { NextResponse } from 'next/server'

/**
 * Route Handler 공통 응답 헬퍼.
 * 성공 응답은 항상 { data } 로 감싸고, 실패 응답은 { message, code? } 형태를 쓴다.
 */
export const ok = <T>(data: T, status = 200) =>
  NextResponse.json({ data }, { status })

export const created = <T>(data: T) => ok(data, 201)

export const noContent = () => new NextResponse(null, { status: 204 })

export const fail = (status: number, message: string, code?: string) =>
  NextResponse.json(code ? { message, code } : { message }, { status })
