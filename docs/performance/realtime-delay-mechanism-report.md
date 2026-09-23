# Realtime 지연 기제 규명 보고서

- 대상: 개선 전 코드의 빈 토픽 구독이 만들던 약 4초 지연
- 추적 일시: 2026-09-23
- 원시 데이터: [results/20260923/realtime-trace.json](./results/20260923/realtime-trace.json)
- 실행 스크립트: `scripts/perf/trace-realtime.mjs`
- 추적 기록: [llm-wiki/raw/2026-09-23-realtime-websocket-head-of-line-blocking-trace.md](../../llm-wiki/raw/2026-09-23-realtime-websocket-head-of-line-blocking-trace.md)
- 선행 문서: [chat-rendering-verification-report.md](./chat-rendering-verification-report.md) 4.2절, [chat-rendering-contribution-report.md](./chat-rendering-contribution-report.md)

---

## 1. 요약

A/B/C 실험(2026-09-02)과 항목별 측정(2026-09-22)은 **빈 토픽 구독이 지연의 원인**임을 확정했으나, **실패한 채널 하나가 왜 다른 채널의 이벤트 전달까지 늦추는지**는 미확인으로 남아 있었다. 이번 추적으로 그 기제를 규명했다.

**기제는 WebSocket 연결 하나에서 일어나는 head-of-line blocking이다.** `realtime-js`는 모든 채널을 연결 하나 위에서 다중화한다. 빈 토픽 접속 요청이 약 4초 동안 응답을 받지 못하고 머무는 사이, 같은 연결의 후속 응답이 전부 그 뒤에 줄을 선다. 정상 채널의 구독 완료도, 새 메시지 이벤트도 함께 밀린다.

**서버 소스에서 같은 크기의 상수를 찾았다.** 다만 해당 코드 경로가 이 환경에서 활성인지 확인할 수 없어 **일치하는 후보**로만 보고한다(5절).

---

## 2. 추적 방법

앱 코드를 전혀 건드리지 않고, Playwright로 WebSocket의 수명과 프레임을 시각과 함께 기록했다.

| 항목 | 값 |
|---|---|
| 조건 | 개선 전 빌드 1개 (`P0_before`) |
| CPU 스로틀링 | 4배 (본 측정과 동일) |
| 메시지 | 10건 (렌더 비용이 관심사가 아니므로 운영 쓰기를 최소화) |
| 관찰 | 초기 렌더 후 20초, 이후 서버에서 INSERT하고 화면 표시까지 |
| 회차 | 3회 |

**성능 비교가 아니라 사건의 순서를 보는 것이므로 유휴 상태는 필요하지 않았다.** 조건이 하나뿐이고 초 단위 구간을 보기 때문에 배경 부하에 둔감하다.

운영 테스트 데이터는 측정 후 전 항목 0건으로 삭제를 검증했다.

---

## 3. 기각된 가설: 소켓 재연결 백오프

`node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js`에서 계단식 재연결 백오프를 발견했다.

```js
const RECONNECT_INTERVALS = [1000, 2000, 5000, 10000]
```

개선 전 지연이 3.8~4.0초에서 고정되어 있었고 네트워크와 메시지 수에 무관했던 것이 이 계단과 맞아 보였다. 그래서 **빈 토픽 join이 거절되면서 소켓이 끊기고 재연결 백오프를 탄다**는 가설을 세웠다.

| 회차 | 소켓 열림 | 소켓 닫힘 |
|---|---|---|
| 1 | 1회 | 0회 |
| 2 | 1회 | 0회 |
| 3 | 1회 | 0회 |

**소켓은 한 번도 끊기지 않았다. 가설은 기각됐다.** `realtime-js`는 채널마다 연결을 만들지 않고 하나를 공유하므로, 채널이 실패해도 연결은 유지된다.

---

## 4. 관측된 기제: head-of-line blocking

### 4.1 빈 토픽 접속은 즉시 거절되지 않는다

| 회차 | 빈 토픽 join → 에러 응답 | 정상 채널 join → ok 응답 | 에러와 정상 ok의 간격 |
|---|---|---|---|
| 1 | 4084ms | 5681ms | 1597ms |
| 2 | 4079ms | 4083ms | **4ms** |
| 3 | 4134ms | 4137ms | **3ms** |

`TopicNameRequired` 응답이 오기까지 **4079~4134ms**가 걸렸고 편차는 **55ms**다. 네트워크 변동이라면 이렇게 모이지 않는다. 어딘가에 고정된 값이 있다는 뜻이다.

두 접속 요청은 같은 시각에 함께 보냈는데, **정상 채널의 응답이 빈 토픽 에러 직후 3~4ms 뒤에 따라 나왔다**(회차 2, 3). 정상 채널의 구독이 빈 토픽 때문에 4초 밀린 것이다.

### 4.2 메시지 전달도 같은 줄에 막힌다

구독이 끝난 뒤 서버에서 메시지를 넣고 화면에 보일 때까지를 쟀다.

| 회차 | INSERT 시점에 대기 중인 빈 토픽 join | INSERT → 화면 표시 | `postgres_changes`와 직전 에러의 간격 |
|---|---|---|---|
| 1 | 있음 | 2113ms | **3ms** |
| 2 | **없음** | **529ms** | 5632ms |
| 3 | 있음 | 1576ms | **2ms** |

**대기 중인 접속 요청이 있으면 새 메시지 이벤트가 그 에러 응답 직후 2~3ms에 도착했고, 없으면 529ms로 빨랐다.** 같은 코드인데 줄이 비어 있느냐에 따라 네 배가 갈린다.

### 4.3 재시도가 반복되므로 매번 걸린다

```
회차 3
 1680ms  빈 토픽 join 전송
 5814ms  ← TopicNameRequired (4134ms)
 7566ms  빈 토픽 join 재전송
11644ms  ← TopicNameRequired (4078ms)
19146ms  빈 토픽 join 재전송
23222ms  ← TopicNameRequired (4076ms)
```

빈 토픽 채널은 한 번 실패하고 끝나지 않는다. **정리되지 않은 채로 남아 재시도를 반복하며, 매번 약 4초씩 줄의 맨 앞을 차지한다.**

이것이 두 결함이 곱해진 결과다.

| 결함 | 결과 |
|---|---|
| `nbreadId` 초깃값이 빈 문자열 | 실패할 채널이 **생성된다** |
| `useEffect`에 async 함수를 넘겨 정리 함수가 전달되지 않음 | 그 채널이 **치워지지 않고 재시도를 반복한다** |

정리가 정상이었다면 `nbreadId`가 채워질 때 `removeChannel`이 실행되어 재시도가 멈췄을 것이다. **다만 이 마지막 문장은 코드를 읽고 내린 추론이며, 정리만 고친 조건을 따로 만들어 확인하지는 않았다.**

---

## 5. 4초의 출처

### 5.1 `TopicNameRequired` 핸들러 자체는 즉시 반환한다

`supabase/realtime`의 `lib/realtime_web/channels/realtime_channel.ex`:

```elixir
def join("realtime:", _params, socket) do
  socket
  |> log_error("TopicNameRequired", "You must provide a topic name")
  |> join_error()
end
```

**빈 토픽 핸들러는 아무것도 기다리지 않는다. 4초는 이 함수 안에 있지 않다.**

### 5.2 같은 파일에서 4000ms 상수를 찾았다

```elixir
# Bounds how long a channel join waits on the Muster registration started by
# maybe_start_muster_join/2, so the client is only told "joined" once Muster
# membership has actually landed ...
@muster_join_await_ms 4_000

defp await_muster_join(task, socket) do
  case Task.yield(task, @muster_join_await_ms) || Task.shutdown(task, :brutal_kill) do
    {:ok, :ok} -> :ok
    {:ok, {:error, reason}} -> log_error(socket, "MusterJoinError", inspect(reason))
    {:exit, reason} -> log_error(socket, "MusterJoinError", inspect(reason))
    nil -> log_error(socket, "MusterJoinError", "timed out after #{@muster_join_await_ms}ms")
  end
end
```

기다리는 쪽은 **정상 토픽의 join**이다. 브로드캐스트 팬아웃을 위한 멤버십 등록이 끝나기 전에 "접속됨"이라고 알리면 그 사이 도착한 브로드캐스트를 놓치므로, 등록이 끝날 때까지 최대 4초를 기다린다.

Phoenix는 한 소켓의 채널 join을 소켓 프로세스에서 순차로 처리한다. 따라서 한 join이 4초를 붙들면 같은 소켓의 다른 응답이 그 뒤에 선다. 4절에서 관측한 현상과 맞물린다.

### 5.3 원인으로 단정하지 않는 이유

`maybe_start_muster_join`은 두 조건을 모두 통과해야 실행된다.

```elixir
if FeatureFlags.enabled?("use_muster_channel_join", tenant_id) do
  unless Muster.local_member?(scope, tenant_id, transport_pid) do
```

**이 기능 플래그가 우리 테넌트에서 켜져 있는지 확인할 수 없다.** Supabase 호스팅 환경의 플래그 상태는 외부에서 볼 수 없다.

또한 4절 4.3의 재시도마다 4초가 반복된 현상이 이 상수만으로는 설명되지 않는다. Muster 대기는 정상 토픽 join 쪽에 있고, 이미 등록된 경우는 `unless Muster.local_member?`로 건너뛰게 되어 있기 때문이다.

따라서 **크기가 일치하는 후보**로만 보고한다.

---

## 6. 확인된 것과 추정

**측정으로 확인된 것**

1. 소켓은 끊기지 않는다. 재연결 백오프는 개입하지 않는다.
2. 빈 토픽 접속 요청의 에러 응답이 4079~4134ms 걸리며, 회차 간 편차가 55ms로 일정하다.
3. 정상 채널의 구독 완료 응답과 `postgres_changes` 이벤트가 그 에러 응답 직후 2~4ms에 도착한다.
4. 대기 중인 요청이 없을 때는 같은 코드에서 이벤트가 529ms에 도착한다.
5. 빈 토픽 재시도가 반복된다.

**소스로 확인된 것**

6. `TopicNameRequired` 핸들러는 대기 없이 즉시 반환한다.
7. 같은 파일에 `@muster_join_await_ms 4_000`이 있고, 정상 join이 이 시간만큼 대기할 수 있다.

**추정으로 남는 것**

8. 위 상수가 관측된 4초의 원인인지. 기능 플래그 상태를 확인할 수 없다.
9. 재시도마다 4초가 반복되는 이유.
10. 순서 보장이 서버와 클라이언트 중 어디에서 생기는지. 관측한 것은 프레임 도착 순서뿐이다.
11. 정리 함수가 정상이었다면 재시도가 멈췄을 것이라는 서술. 코드 읽기 기반이며 조건을 만들어 확인하지 않았다.
12. 관찰 3회로는 4.1초가 다른 환경에서도 같은지 말할 수 없다.

---

## 7. 앞선 측정들과의 연결

본 측정(2026-08-28)에서 **개선 전 전송 지연이 네트워크를 400ms 느리게 해도, 메시지를 3배로 늘려도 3.8~4.0초에서 변하지 않았다.** 당시에는 이 사실이 "네트워크도 렌더 비용도 원인이 아니다"라는 소거 근거로만 쓰였고, 왜 고정값인지는 설명하지 못했다.

이번 추적이 그 자리를 채운다. 본 측정은 초기 렌더 후 **5초 안정화 대기** 뒤에 메시지를 주고받았는데, 회차 3을 보면 빈 토픽 접속이 1680ms에 나가 5814ms에 에러를 받는다. **5초 시점은 이 구간 한가운데다.** 재시도가 약 4초 주기로 반복되므로 5초를 기다린 뒤 전송하면 거의 항상 대기 중인 요청이 하나 있었다.

즉 **그 시간은 일의 양이 아니라 줄을 막은 요청 하나가 비워지기를 기다린 시간이었다.**

---

## 8. 더 확인하려면

| 남은 질문 | 방법 | 비용 |
|---|---|---|
| Muster 기능 플래그가 켜져 있는가 | Supabase 지원 문의 | 답변 대기 |
| 상수가 실제 원인인가 | 자체 호스팅 Realtime에서 플래그를 켜고 끄며 재현 | 인스턴스 구축 필요 |
| 정리 함수만 고치면 재시도가 멈추는가 | 정리만 수정한 조건을 빌드해 프레임 추적 | 약 20분 |
| 4.1초가 환경에 무관한가 | 다른 시각·다른 네트워크에서 재관찰 | 약 10분 |

**블로그와 포트폴리오에는 6절의 1~7번까지만 쓰면 충분하다.** 8~12번은 한계로 밝히고, 특히 5절의 상수는 "일치하는 후보"라는 표현을 유지해야 한다.
