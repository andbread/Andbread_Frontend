# 채팅 성능 검증 실행 런북

계획서: [chat-rendering-verification-plan.md](./chat-rendering-verification-plan.md)

현재 상태: **본 측정 완료, 운영 데이터 정리 완료** (2026-09-01)

결과는 [chat-rendering-verification-report.md](./chat-rendering-verification-report.md) 참고. 남은 것은 계측 원복과 블로그 갱신뿐이다.

---

## 0. 완료된 것

| 항목 | 상태 |
|---|---|
| 운영 테스트 계정 2개 + 엔빵 그룹 | **삭제 완료** (2026-09-01). 잔존 0건 검증됨 |
| 운영 채팅방 상태 | **전량 삭제 완료.** `notification`도 0건 |
| 본 측정 | 480런 완료. 실패 1건(재시도 성공) |
| Before 워크트리 | 임시 경로에 생성, PR #144 역적용 + 계측 적용, `--profile` 빌드 완료 |
| After 빌드 | 현재 워크트리에 `--profile` 빌드 완료 |
| `.env.production.local` | 운영 값으로 생성됨 (개발용 `.env.local`을 덮어씀) |
| 계측 | `src/components/perf/PerfProfiler.tsx` + `page.tsx` 한 줄. 양쪽 바이트 동일 |
| 스크립트 | setup / seed / run / analyze / cleanup 전부 작성 및 검증 |
| 파일럿 | S2, S4 통과. 실패 0건, 재시도 0건 |
| 시각 자료 | 신규 DevTools 캡처 없음. 4절 참고 |

Before 워크트리 경로:

```
%LOCALAPPDATA%\Temp\claude\C--Users-user-orca-workspaces-Andbread-Frontend------------\851049cf-30c7-4e0c-8bd9-617927e7cc50\scratchpad\perf-before
```

계정 정보 JSON (비밀번호 포함, 저장소에 없음):

```
...\851049cf-30c7-4e0c-8bd9-617927e7cc50\scratchpad\perf-test-accounts.json
```

---

## 1. 측정 전 점검

- [ ] 다른 작업 종료 (빌드, 테스트, 다른 에이전트). **측정 중 CPU를 쓰면 결과가 오염된다**
- [ ] 전원 AC 연결, 고성능 모드
- [ ] 두 서버 응답 확인

```bash
curl -s -o /dev/null -w "3000:%{http_code}\n" http://127.0.0.1:3000/login
curl -s -o /dev/null -w "3001:%{http_code}\n" http://127.0.0.1:3001/login
```

서버가 내려가 있으면 다시 띄운다. `next start`가 셸 래퍼에 가로채이므로 `-p` 대신 `PORT`와 직접 실행을 쓴다.

```powershell
# Before (3000) — Before 워크트리에서
$env:PORT="3000"; node .\node_modules\next\dist\bin\next start

# After (3001) — 현재 워크트리에서
$env:PORT="3001"; node .\node_modules\next\dist\bin\next start
```

빌드가 없으면 각 디렉터리에서 다시 빌드한다(Sentry 업로드는 끈다).

```bash
SENTRY_AUTH_TOKEN= npx next build --profile
```

---

## 2. 본 측정

```bash
SETUP="<scratchpad>/perf-test-accounts.json"
node scripts/perf/run-measurement.mjs "$SETUP" --out "docs/performance/results/$(date +%Y%m%d)"
```

- 12셀 x (워밍업 3 + 본 20) x 2조건 = **552런**, 실측 12.5~20초/런 기준 **약 3시간**
- 조건은 회차마다 순서를 뒤집어 교차 실행된다
- 회차 실패 시 최대 3회 재시도하고 `failures`에 기록한다
- 규모(100/300)가 바뀌는 셀 경계에서 자동으로 재시딩한다

좁혀서 돌리려면 `--only S2,S4`, 빠른 점검은 `--pilot`(셀당 3회).

---

## 3. 분석

```bash
node scripts/perf/analyze.mjs docs/performance/results/<날짜>/raw-main.json
```

`raw-main-analysis.md`(표)와 `raw-main-analysis.json`이 생성된다. 중앙값/IQR/p95, Mann-Whitney U p값, rank-biserial 효과 크기를 낸다.

---

## 4. 시각 자료 (2026-09-01 결정: 신규 캡처 없음)

React DevTools Profiler 화면 캡처는 **이번 측정에서는 만들지 않기로 했다.**

- DevTools 패널은 페이지와 분리된 화면이라 Playwright로 접근할 수 없다.
- OS 수준 스크린샷은 대상 창이 화면 맨 앞에 있어야 한다. 측정용 브라우저가 데스크톱을 점유해야 하므로 자동화로 우회할 수 없다.
- 자동화 브라우저에 확장을 로드하는 것도 막혔다. Playwright 기본 인자의 `--disable-extensions`를 `ignoreDefaultArgs`로 뺀 뒤에야 확장이 뜨고, 언팩 로드로는 React DevTools가 페이지에 훅을 주입하지 못한다. 사용자 프로필의 확장 폴더를 복사한 프로필에서는 훅이 붙는 것까지 확인했으나 재현이 불안정했다.

대신 **지난 블로그 글의 DevTools 캡처를 병목 탐색 단계의 자료로 남기고, 이번 재측정 결과는 표로 제시한다.** 두 자료는 도구와 환경이 다르므로 수치를 나란히 비교하지 않는다.

나중에 캡처가 필요해지면 사용자 Chrome에서 직접 하는 것이 가장 빠르다. 서버를 띄우고 시딩한 뒤, 콘솔에 세션을 주입하고 Profiler를 녹화하면 된다. 세션 주입 스니펫은 `scripts/perf/attach-to-chrome.mjs`의 주입 로직을 그대로 쓰면 된다.

---

## 5. 정리 (측정 완전 종료 후)

**2026-09-01 실행 완료.** 재측정을 새로 돌린 경우에만 다시 실행하면 된다.

```bash
node scripts/perf/cleanup-test-accounts.mjs "$SETUP"
```

- `chat_messages` → `notification` → `participant` → `nbread` → 알림설정/`fcm_token` → `auth.users` 순으로 삭제
- 전 항목 0건을 검증하고, 하나라도 남으면 비정상 종료한다
- 출력 JSON을 보고서 증거물로 첨부한다

측정 환경 원복:

- [ ] `.env.production.local` 삭제
- [ ] 계측 되돌리기: `src/components/perf/PerfProfiler.tsx` 삭제, `page.tsx`의 `PerfProfiler` 래핑 제거
- [ ] Before 워크트리 제거: `git worktree remove <경로> --force`
- [ ] 워크트리에 복사한 `.env`, `.env.local` 삭제

---

## 6. 알려진 이슈와 대응

| 증상 | 원인 | 대응 |
|---|---|---|
| `PGRST303 JWT issued at future` 401 | 갓 발급된 토큰을 운영 PostgREST가 간헐적으로 거절 | 러너가 회차 단위로 최대 3회 재시도. 조건과 무관하게 무작위라 비교가 치우치지 않는다 |
| Before에서 보낸 메시지가 안 그려짐 | Before는 realtime 수신에만 의존하는데, 구독 완료 전에 보내면 이벤트를 놓친다. 빈 토픽(`realtime:`)으로 먼저 join해 `TopicNameRequired` 에러도 난다 | 초기 렌더 후 **5초 안정화 대기**(`SETTLE_MS`)를 양쪽 동일하게 적용 |
| `next start -p` 옵션 오류 | 셸 래퍼가 명령을 가로챔 | `PORT` 환경 변수 + `node node_modules/next/dist/bin/next start` |
| 페인트 무한 대기 | realtime 미수신 | `PAINT_TIMEOUT_MS` 30초 후 실패 처리 → 재시도 |

---

## 7. 항목별 기여도 측정 (2026-09-22 준비)

설계는 계획서 [15절](./chat-rendering-verification-plan.md) 참고.

### 실행

```bash
node scripts/perf/run-tonight.mjs
```

이 한 줄이 전부다. 서버 8개 기동 → 운영 테스트 계정 생성 → 메시지 100건 시딩 → 176런 측정 → 분석표 생성 → 운영 데이터 삭제 및 0건 검증 → 서버 종료를 순서대로 수행하고, **중간에 실패해도 정리와 서버 종료는 반드시 수행한다.**

소요 시간은 약 1시간이다. 계정 생성과 시딩에 1~2분, 측정에 약 55분, 정리에 1분 걸린다.

### 측정 중 지켜야 할 것

측정이 시작되면 "측정 시작. 이 시점부터 노트북을 건드리지 않아야 한다"가 출력된다. 그 뒤로는 유휴 상태를 유지한다.

| 해도 되는 것 | 하면 안 되는 것 |
|---|---|
| 자리 비우기, 화면 끄기 | 빌드, 테스트, 다른 에이전트 세션 |
| 휴대폰 등 다른 기기 사용 | 탭이 많은 브라우저, 화상회의, 영상 재생 |
| | 도커, 인덱싱, 백업, 윈도우 업데이트 |
| | **절전 모드 진입** |

전원은 AC에 연결하고 고성능 모드로 둔다. 1시간은 노트북이 열로 클럭을 내리기 충분한 시간이라, 배터리 모드면 뒤쪽 회차가 앞쪽보다 느려진다.

CPU 4배 제한이 운영체제 스케줄러 위에서 동작하므로, 다른 프로세스가 CPU를 가져가면 제한 배율 자체가 흔들린다. 본 측정은 4초 대 49밀리초라 잡음을 견뎠지만 **이번에 가려낼 C축은 200~500ms, F축은 100ms 규모라 분산이 커지면 그냥 묻힌다.**

### 조건 빌드

`C:\Users\user\AppData\Local\Temp\pf\<조건키>` 에 워크트리와 빌드가 준비돼 있다. 개선 후(`P7_after`)만 현재 워크트리를 그대로 쓴다.

다시 만들어야 하면 다음을 실행한다. 약 25분 걸린다.

```bash
PERF_SCRATCH="C:/Users/user/AppData/Local/Temp/pf" node scripts/perf/setup-conditions.mjs
```

`--only P2_A,P3_AC` 로 좁힐 수 있고, `--skip-build` 로 치환만 확인할 수 있다. **치환 대상을 하나라도 못 찾으면 즉시 실패하므로, 조용히 빗나간 조건으로 측정될 일은 없다.**

### 결과

`docs/performance/results/<날짜>/` 아래에 생성된다.

- `contribution-raw.json` 원시 데이터
- `contribution-raw-analysis.md` 조건별 중앙값·IQR·개선 전 대비 감소량·p값·효과 크기, A와 C의 중첩분
- `contribution-raw-analysis.json`

### 결과를 읽을 때 주의

- **항목별 감소량을 더해서 전체와 맞추면 안 된다.** A와 C는 같은 비용을 다른 경로로 줄이므로 겹친다. 중첩분을 따로 보고하는 이유다.
- **이 측정의 절대값은 A/B/C 실험(2026-09-02)과 비교할 수 없다.** 그 실험은 브라우저 밖에서 시각을 쟀다. 이번 측정은 본 측정 S2와 같은 방식이므로 본 측정과는 비교할 수 있다.
- **F축이 유의하지 않게 나오는 것은 예상된 결과다**(H12). 효과 부재가 아니라 검출 한계 미만으로 보고한다.
