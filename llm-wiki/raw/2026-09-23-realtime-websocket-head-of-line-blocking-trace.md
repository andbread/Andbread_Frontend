# 빈 토픽 구독이 지연을 만드는 기제 추적 기록

출처: Claude Code 세션의 WebSocket 프레임 추적
확인 날짜: 2026-09-23
원시 데이터: `docs/performance/results/20260923/realtime-trace.json`
실행 스크립트: `scripts/perf/trace-realtime.mjs`
관련 문서: `raw/2026-09-02-chat-realtime-subscription-ab-experiment-session-log.md`

## 추적하게 된 경위

A/B/C 실험(2026-09-02)에서 빈 토픽 구독이 지연의 원인임을 확정했으나, **실패한 채널 하나가 왜 다른 채널의 이벤트 전달까지 늦추는지**는 규명하지 못한 채로 남아 있었다. 보고서와 포트폴리오 초안에도 "라이브러리 내부 기제는 확인하지 못했다"로 적어 두었다.

`node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js`를 읽다가 `RECONNECT_INTERVALS = [1000, 2000, 5000, 10000]`이라는 계단식 재연결 백오프를 발견했다. 개선 전 지연이 3.8~4.0초에서 고정되어 있었고 네트워크 지연이나 메시지 수에 무관했던 것이 이 백오프와 맞아떨어져 보였다.

그래서 가설을 세웠다. **빈 토픽 join이 거절되면서 소켓 자체가 끊기고, 재연결 백오프를 타느라 약 4초가 걸린다**는 것이었다. 앱 코드를 건드리지 않고 Playwright로 WebSocket 수명과 프레임을 시각과 함께 기록해 확인했다.

조건은 개선 전 빌드 하나, CPU 4배 제한, 메시지 10건, 3회 관찰이다. 성능 비교가 아니라 사건 순서를 보는 것이므로 유휴 상태는 필요하지 않았다.

## 가설은 기각됐다

| 회차 | 소켓 열림 | 소켓 닫힘 |
| --- | --- | --- |
| 1 | 1회 | 0회 |
| 2 | 1회 | 0회 |
| 3 | 1회 | 0회 |

**소켓은 한 번도 끊기지 않았다.** 재연결 백오프는 개입하지 않았다. `realtime-js`는 모든 채널을 소켓 하나 위에서 다중화하므로, 채널 하나가 실패해도 소켓은 유지된다.

## 실제로 관측된 것

| 회차 | 빈 토픽 join → 에러 응답 | 정상 채널 join → ok 응답 | 에러 → 정상 ok 간격 |
| --- | --- | --- | --- |
| 1 | 4084ms | 5681ms | 1597ms |
| 2 | 4079ms | 4083ms | **4ms** |
| 3 | 4134ms | 4137ms | **3ms** |

두 가지가 드러났다.

첫째, **빈 토픽 join은 즉시 거절되지 않는다.** `TopicNameRequired` 에러 응답이 오기까지 회차마다 4084, 4079, 4134ms가 걸렸다. 편차가 55ms에 불과할 만큼 일정하다. 클라이언트의 백오프가 아니라 서버 쪽의 고정된 처리 시간으로 보인다.

둘째, **정상 채널의 join 응답이 빈 토픽 에러 직후에 도착한다.** 회차 2와 3에서는 간격이 3~4ms였다. 두 join은 같은 시각에 함께 보냈는데, 정상 채널의 응답이 빈 토픽 에러를 기다렸다가 따라 나온 것이다.

## 메시지 전달도 같은 줄에 막힌다

구독이 끝난 뒤 서버에서 메시지를 INSERT하고 화면에 보일 때까지를 쟀다. 여기서 결정적인 차이가 나왔다.

| 회차 | INSERT 시점에 대기 중인 빈 토픽 join | INSERT → 화면 표시 | `postgres_changes`와 직전 에러의 간격 |
| --- | --- | --- | --- |
| 1 | 있음 | 2113ms | **3ms** |
| 2 | **없음** | **529ms** | 5632ms |
| 3 | 있음 | 1576ms | **2ms** |

**빈 토픽 join이 진행 중일 때는 `postgres_changes` 프레임이 그 에러 응답 직후 2~3ms 뒤에 도착했다.** 대기 중인 join이 없었던 회차 2에서는 529ms로 빨랐다.

즉 기제는 **head-of-line blocking**이다. 소켓 하나 위에서 응답이 순서대로 전달되는데, 빈 토픽 join이 약 4초 동안 줄의 맨 앞을 차지하고 있어서 그 뒤의 모든 것이 밀린다. 정상 채널의 구독 완료도, 새 메시지 이벤트도 함께 밀린다.

## 본 측정의 수치와 맞아떨어진다

본 측정은 초기 렌더 후 **5초 안정화 대기** 뒤에 메시지를 주고받았다. 회차 3을 보면 빈 토픽 join이 1680ms에 나가서 5814ms에 에러를 받는다. **5초 시점은 이 구간 한가운데다.**

빈 토픽 재시도가 약 4초 주기로 반복되므로, 5초를 기다린 뒤 전송하면 거의 항상 대기 중인 join이 하나 있었다. 개선 전 전송 지연이 네트워크를 400ms 느리게 해도, 메시지를 3배로 늘려도 3.8~4.0초에서 변하지 않았던 이유가 여기에 있다. **그 시간은 일의 양이 아니라 줄을 막고 있는 join 하나가 비워지기를 기다리는 시간이었다.**

## 확정한 내용과 확인이 필요한 내용

확정한 내용은 다음과 같다.

- 소켓은 끊기지 않는다. 재연결 백오프 가설은 기각됐다.
- 빈 토픽 join에 대한 에러 응답이 약 4.1초 걸리며, 이 값은 회차 간 편차가 매우 작다.
- 정상 채널의 join 응답과 `postgres_changes` 이벤트가 그 에러 응답 직후에 도착한다. 소켓 하나 위에서 응답이 순서대로 전달되면서 생기는 head-of-line blocking이다.
- 대기 중인 빈 토픽 join이 없을 때는 이벤트가 529ms에 도착했다. 같은 코드에서도 줄이 비어 있으면 빠르다.

확인이 필요한 내용은 다음과 같다.

- **서버가 왜 빈 토픽 join을 4초나 붙들고 있다가 거절하는지**는 모른다. Supabase Realtime 서버 구현을 보지 않았고, 타임아웃 설정값인지 다른 이유인지 구분하지 못했다.
- 순서 보장이 서버 쪽에서 생기는지 클라이언트 쪽에서 생기는지 구분하지 못했다. 관측한 것은 프레임 도착 순서뿐이다.
- 회차 1에서만 에러와 정상 ok의 간격이 1597ms로 벌어졌다. 회차 2와 3의 3~4ms와 다른 이유를 확인하지 않았다.
- 관찰 3회로는 4.1초라는 값이 모든 환경에서 같은지 말할 수 없다.

---

## 추가 조사: 4초의 출처 (같은 날, 프레임 추적 이후)

위 기록을 쓴 뒤 `supabase/realtime` 저장소를 확인했다. 서버는 Elixir와 Phoenix로 작성되어 있고 공개되어 있다.

먼저 `lib/realtime_web/channels/realtime_channel.ex`에서 빈 토픽 처리 절을 찾았다.

```elixir
def join("realtime:", _params, socket) do
  socket
  |> log_error("TopicNameRequired", "You must provide a topic name")
  |> join_error()
end
```

**이 핸들러는 아무것도 기다리지 않고 즉시 반환한다.** 따라서 관측된 4초는 이 함수 안에 있지 않다.

같은 파일에서 4000밀리초 상수를 찾았다.

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

기다리는 쪽은 정상 토픽의 join이다. 브로드캐스트 팬아웃을 위한 멤버십 등록이 끝나기 전에 접속 완료를 알리면 그 사이 도착한 브로드캐스트를 놓치므로, 등록이 끝날 때까지 최대 4초를 기다리도록 되어 있다. Phoenix는 한 소켓의 채널 join을 소켓 프로세스에서 순차로 처리하므로, 한 join이 4초를 붙들면 같은 소켓의 다른 응답이 그 뒤에 선다.

측정값 4079~4134밀리초와 상수 4000밀리초가 맞아떨어진다.

다만 원인으로 단정하지 않는다. 이 코드는 두 조건을 통과해야 실행된다.

```elixir
if FeatureFlags.enabled?("use_muster_channel_join", tenant_id) do
  unless Muster.local_member?(scope, tenant_id, transport_pid) do
```

**기능 플래그가 우리 테넌트에서 켜져 있는지 외부에서 확인할 수 없다.** 또한 빈 토픽 재시도마다 4초가 반복된 현상이 이 상수만으로는 설명되지 않는다. Muster 대기는 정상 토픽 join 쪽에 있고, 이미 등록된 경우는 건너뛰게 되어 있기 때문이다.

따라서 **크기가 일치하는 후보**로 기록한다. 확정하려면 자체 호스팅 인스턴스에서 플래그를 켜고 끄며 재현하거나 Supabase에 문의해야 한다.

참고한 파일: `supabase/realtime` 저장소의 `lib/realtime_web/channels/realtime_channel.ex`, `ERROR_CODES.md`
