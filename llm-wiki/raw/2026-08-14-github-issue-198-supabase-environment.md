# GitHub Issue #198: [feature-76/supabase-environment] Supabase 운영 및 개발 환경 분리

- URL: https://github.com/andbread/Andbread_Frontend/issues/198
- 생성일: 2026-08-14T02:33:22Z
- 라벨: ✨ Feature
- 담당자: hm1n
- 프로젝트: 확인 필요 (이슈 생성 시점에 프로젝트 보드 미연결)

---

## Summary

- 현재 하나의 Supabase 프로젝트를 함께 쓰는 운영 환경과 개발 환경을 별도 프로젝트로 분리합니다.
- 마이그레이션과 저장소의 Edge Function 코드를 사용해 개발 프로젝트의 데이터베이스 구성과 서버 함수를 재현합니다.
- 환경별 비밀값과 환경변수를 분리하고, 예약 작업 및 대시보드 전용 설정의 이관 여부를 확인합니다.

---

## Why

### 해결하려는 문제가 무엇인가요?

- 현재 운영과 개발이 하나의 Supabase 프로젝트를 함께 사용해 개발 및 검증 작업이 운영 데이터와 기능에 영향을 줄 수 있습니다.
- 테스트 도입과 API route의 Supabase 이관을 앞두고 있어, 안전하게 변경 사항을 검증할 수 있는 독립된 개발 데이터베이스가 필요합니다.
- 환경을 분리하지 않으면 테스트 데이터가 운영 데이터에 섞이거나, 함수와 데이터베이스 설정 변경이 운영 기능에 바로 영향을 줄 위험이 있습니다.

---

## Goal

### 완료되면 무엇이 달라지나요?

- 운영용 Supabase 프로젝트와 별도로 개발용 Supabase 프로젝트를 사용합니다.
- `supabase/migrations/*.sql`을 기준으로 개발 프로젝트에 스키마, 데이터베이스 함수, 트리거, 예약 작업을 재현할 수 있습니다.
- `supabase/functions/`의 Edge Function 7개를 개발 프로젝트에 배포하고 환경별 설정을 분리합니다.
- 로컬과 지속적 통합 환경이 개발용 Supabase 값을 사용하고, 운영 환경은 기존 운영용 값을 계속 사용합니다.
- 범위 제외: 이번 작업에서는 RLS 정책 자체를 변경하지 않습니다. 정책 변경이 필요하면 별도 검토와 작업으로 분리합니다.

---

## Approach

### 어떻게 해결할 계획인가요?

- 새 Supabase 개발 프로젝트를 만든 뒤 `supabase link`와 `supabase db push`로 저장소의 마이그레이션을 적용합니다.
- `supabase/migrations/20260814111507_schedule_auto_generate_nbread_records_cron.sql`을 포함한 마이그레이션으로 매일 협정 세계시 15시에 실행되는 `auto-generate-nbread-records` 예약 작업을 재현합니다.
- 예약 작업이 참조하는 Vault 비밀값 `project_url`, `nbread_auto_generate_cron_secret`은 운영 값과 분리된 개발용 값으로 개발 프로젝트에 직접 등록합니다. 실제 비밀값은 이슈, 코드, 커밋에 기록하지 않습니다.
- 다음 Edge Function 7개를 개발 프로젝트에 재배포하고, `x-cron-secret` 검증값을 포함한 관련 환경변수를 개발용 값과 일치시킵니다.
  - `auto-generate-nbread-records`
  - `chat-notification`
  - `friend-request-notification`
  - `friend-response-notification`
  - `nbread-invite-accept-notification`
  - `nbread-invite-notification`
  - `payment-notification`
- 개발 환경에서 예약 작업을 매일 자동 실행하면 개발 데이터가 의도치 않게 바뀔 수 있으므로, 기본 비활성화를 권장안으로 두고 활성화 여부를 작업 중 결정합니다.
- 로컬과 지속적 통합 환경의 현재 환경변수 구조를 확인한 뒤 개발용과 운영용 Supabase 값을 분리합니다.
- Database Webhook 등 대시보드에서만 설정됐을 수 있는 항목을 전수 확인하고, 필요한 설정만 개발 프로젝트로 옮깁니다.
- 검토한 대안: 기존 프로젝트를 계속 함께 쓰는 방식은 설정 비용이 적지만 테스트와 이관 작업이 운영 데이터에 영향을 줄 위험을 해소하지 못하므로 선택하지 않습니다.

---

## Tasks

- [ ] 신규 Supabase 개발 프로젝트 생성
- [ ] 개발 프로젝트 연결 후 `supabase db push`로 마이그레이션 적용
- [ ] 스키마, 데이터베이스 함수, 트리거, 예약 작업 재현 여부 확인
- [ ] 개발용 Vault 비밀값 `project_url`, `nbread_auto_generate_cron_secret` 등록
- [ ] Edge Function 7개를 개발 프로젝트에 재배포
- [ ] `x-cron-secret` 검증값 등 Edge Function 관련 환경변수를 개발용 값과 일치시키기
- [ ] 개발 환경의 `auto-generate-nbread-records` 예약 작업 활성화 여부 결정 및 반영
- [ ] 로컬 및 지속적 통합 환경변수 구조 확인 후 개발용과 운영용 값 분리
- [ ] Database Webhook 등 대시보드 전용 설정 존재 여부 전수 확인
- [ ] 필요한 대시보드 전용 설정을 개발 프로젝트로 이관

---

## Constraints

- 기존 운영 기능과 운영 데이터에 영향을 주지 않아야 합니다.
- 실제 비밀값은 이슈 본문, 코드, 커밋에 포함하지 않습니다.
- 운영용과 개발용 비밀값 및 환경변수를 서로 다르게 관리합니다.
- RLS 관련 변경은 별도로 신중히 검토하며 이번 이슈 범위에는 포함하지 않습니다.
- 확인 필요: Database Webhook을 포함해 저장소의 마이그레이션과 함수 코드만으로 재현되지 않는 대시보드 전용 설정이 있는지 전수 확인해야 합니다.
- 확인 필요: 개발 환경의 예약 작업은 데이터 오염 가능성을 고려해 비활성 상태를 기본안으로 삼고 최종 운영 방식을 결정해야 합니다.

---

## Definition of Done

- [ ] 운영용과 개발용 Supabase 프로젝트가 분리됨
- [ ] 개발 프로젝트에서 모든 마이그레이션이 오류 없이 적용됨
- [ ] 개발 프로젝트에서 스키마, 데이터베이스 함수, 트리거가 재현된 것을 확인함
- [ ] 개발용 Vault 비밀값이 실제 값을 노출하지 않는 방식으로 등록됨
- [ ] Edge Function 7개가 개발 프로젝트에 배포되고 개발용 설정으로 동작함
- [ ] 개발 환경의 예약 작업 활성화 정책이 결정되고 의도한 상태로 반영됨
- [ ] 로컬과 지속적 통합 환경이 개발용 값을 사용하며 운영 환경 설정은 유지됨
- [ ] 대시보드 전용 설정 전수 확인과 필요한 이관이 완료됨
- [ ] 운영 기능과 데이터에 영향이 없음을 확인함
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] 환경 분리 및 설정 방법 문서가 필요한 경우 갱신됨
