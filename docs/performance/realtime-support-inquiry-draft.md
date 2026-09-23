# Supabase 지원 문의 초안 (미발송)

> 이 문서는 [실험 계획서](./realtime-delay-root-cause-experiment-plan.md) 실험 4의 산출물이다. **발송하지 않았다.** 발송 여부와 채널(지원 티켓, GitHub Discussion)은 사람이 결정한다. 프로젝트 ref, 채널 ID, 키, 토큰은 모두 지웠다. 발송할 때 프로젝트 ref는 지원 티켓의 비공개 필드에만 적는다.

---

**Subject:** Hosted Realtime: `TopicNameRequired` join error is returned after a fixed ~4.08 s and blocks other frames on the same WebSocket — which `CHANNEL_ERROR_BACKOFF_MS` / Realtime version is deployed?

Hello,

While investigating a chat latency issue in our app, we observed the following on our hosted project (project ref provided in the private field). The client bug that caused it (subscribing to an empty topic `realtime:`) is already fixed on our side. We are asking only to confirm the server-side values, so that our write-up does not state anything incorrect about your platform.

### What we observed (client side only)

1. A `phx_join` to the bare topic `realtime:` on a fresh WebSocket (vsn 1.0.0, no other channel joined) is answered with `phx_reply status=error reason="TopicNameRequired: You must provide a topic name"` after a **median of ~4,077 ms** (24/24 runs between 4,074 and 4,146 ms). We measured this with three independent clocks: a Node WebSocket client (`performance.now()`), Chrome DevTools Protocol frame timestamps, and in-page `performance.now()`.
2. The round trip time of a `phoenix` heartbeat on an idle connection is a median of 75.9 ms (36 samples). The error reply minus that round trip is a median of **4,001 ms** (12 runs), so it looks like a **fixed ~4,000 ms server-side wait plus one round trip**.
3. A heartbeat sent 1.0 s or 2.5 s after the empty-topic join is answered only **0–0.7 ms after the error reply** (24/24 probes). Heartbeats sent after the error are back to ~75 ms.
4. While that join is pending, other frames on the **same** WebSocket are held back as well and arrive only after the error reply: the `phx_reply ok` of a regular channel join sent right after it, the `system` "subscribed" message, `phx_leave` replies, and `postgres_changes` events for an already-joined channel (30/30 runs: 0–0.3 ms after the error reply). On a **separate** WebSocket from the same client, `postgres_changes` events arrive in a median of ~445 ms after the insert request starts, close to the ~315 ms we see with no empty-topic join at all.

Anonymized frame timeline from our app (single socket, ms since the empty-topic join was sent; a row is inserted at +2,007 ms):

```
     0  → phx_join  topic="realtime:"                         ref=3
  2249  → phx_leave topic="realtime:"                         ref=4   (sent by realtime-js rejoin timer)
  2249  → phx_join  topic="realtime:"                         ref=5
  4104  ← phx_reply topic="realtime:" ref=3 status=error TopicNameRequired
  4104  ← phx_reply topic="realtime:" ref=4 status=ok
  8092  ← phx_reply topic="realtime:" ref=5 status=error TopicNameRequired
  8098  ← postgres_changes topic="realtime:<channel>"
```

### Our reading of the public source (please correct us)

- `RealtimeWeb.RealtimeChannel.join("realtime:", _, socket)` → `log_error("TopicNameRequired", ...)` → `join_error/1`, which calls `Process.sleep(channel_error_backoff_ms())` before returning the error (added in supabase/realtime#1806).
- The public default in `config/runtime.exs` / `ENVS.md` is `CHANNEL_ERROR_BACKOFF_MS = 5000`, which does **not** match the ~4,000 ms we see.
- In `supabase/phoenix` (branch `v1.8-no-drop-missing-join-refs`), `Phoenix.Socket.handle_in/4` for `phx_join` calls `Phoenix.Channel.Server.join/4`, which waits in `receive` for the channel process's join reply. `postgres_changes` are fastlaned to `transport_pid` (`{:subscriber_fastlane, transport_pid, ...}`). If we read this correctly, this would explain why a sleeping join error holds back all frames of that socket.

### Questions

1. Which Realtime version was serving our project on 2026-09-23 (around 07:00–09:00 UTC)?
2. What value of `CHANNEL_ERROR_BACKOFF_MS` (or an equivalent setting) is configured on the hosted cluster for our project?
3. Is it expected that a join error backoff delays **other** channels' frames on the same WebSocket (as described in point 3), or is there another mechanism that we are missing?
4. Is the `use_muster_channel_join` feature flag enabled for our project? (We have observed the ~4 s delay even without joining any regular channel, so we believe it is not required for this behavior, but we would like to confirm.)

Thank you.
