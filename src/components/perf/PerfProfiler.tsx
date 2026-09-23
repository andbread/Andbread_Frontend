'use client'

import { Profiler, ProfilerOnRenderCallback, ReactNode } from 'react'

/**
 * 채팅 렌더링 성능 측정용 계측 래퍼.
 *
 * PR #144 diff에 포함되지 않은 파일에만 손대므로 Before/After 양쪽에
 * 완전히 동일한 계측이 들어간다. 측정 종료 후 되돌린다.
 *
 * `next build --profile`로 빌드해야 프로덕션 번들에서도 onRender가 동작한다.
 */

interface PerfEntry {
  id: string
  phase: 'mount' | 'update' | 'nested-update'
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
}

declare global {
  interface Window {
    __perfLog?: PerfEntry[]
  }
}

const handleRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  if (typeof window === 'undefined') {
    return
  }

  if (!window.__perfLog) {
    window.__perfLog = []
  }

  window.__perfLog.push({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  })
}

interface PerfProfilerProps {
  id: string
  children: ReactNode
}

const PerfProfiler = ({ id, children }: PerfProfilerProps) => (
  <Profiler id={id} onRender={handleRender}>
    {children}
  </Profiler>
)

export default PerfProfiler
