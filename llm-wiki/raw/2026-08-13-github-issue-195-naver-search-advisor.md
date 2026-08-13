# GitHub Issue #195: [feature-75/naver-search-advisor] 네이버 서치어드바이저 등록

- URL: https://github.com/andbread/Andbread_Frontend/issues/195
- 생성일: 2026-08-13T03:08:15Z
- 라벨: ✨ Feature
- 담당자: hm1n
- 프로젝트: KANBAN / Status: Todo

---

## Summary

> 3줄 이내로 이번 작업을 요약합니다.

- 네이버 서치어드바이저에 사이트를 등록하고 소유 확인을 완료합니다.
- 소유 확인은 HTML 태그 방식을 사용하며, `layout.tsx`의 metadata에 검증 태그를 추가합니다.
- sitemap 제출 및 robots.txt의 네이버 크롤러 접근 허용 여부를 함께 확인합니다.

---

## Why

### 해결하려는 문제가 무엇인가요?

- 현재 엔빵 서비스는 네이버 서치어드바이저에 등록되어 있지 않아, 네이버 검색 결과에 노출되지 않거나 색인이 지연될 수 있습니다.
- 국내 검색 트래픽 비중이 높은 네이버 특성상, 서치어드바이저 미등록 시 검색 유입 채널을 놓치게 됩니다.
- 해결하지 않으면 신규 페이지(랜딩페이지, sitemap 등)가 네이버에 정상적으로 색인되지 않아 검색 유입 기회를 잃습니다.

---

## Goal

### 완료되면 무엇이 달라지나요?

- 네이버 서치어드바이저에 사이트가 등록되고 소유 확인이 완료된 상태가 됩니다.
- 네이버 서치어드바이저를 통해 sitemap이 제출되고, robots.txt가 네이버 크롤러(Yeti)의 접근을 허용하는지 확인됩니다.
- Non-goal: 네이버 검색 노출 순위 최적화, 키워드 전략 수립은 이번 작업 범위에 포함하지 않습니다.

---

## Approach

### 어떻게 해결할 계획인가요?

- 네이버 서치어드바이저(https://searchadvisor.naver.com)에 사이트(`https://www.nbread.co.kr`)를 등록합니다.
- 소유 확인은 HTML 태그 방식을 사용합니다. 발급받은 검증 코드를 `src/app/layout.tsx`의 `metadata.verification.other`에 `naver-site-verification` 키로 추가합니다.
  - 참고: 현재 `metadata`에는 검증 관련 필드가 없어 신규로 추가합니다.
- 배포 후 서치어드바이저에서 소유 확인을 완료합니다.
- 기존 `public/robots.txt`, `public/sitemap.xml`을 서치어드바이저에 제출하고, 네이버 크롤러 접근이 허용되어 있는지 확인합니다.
  - 현재 `robots.txt`는 `User-agent: *`로 전체 허용/비허용 규칙을 두고 있어 별도 Yeti 규칙은 없는 상태입니다. 문제가 없는지 확인이 필요합니다.
- 검토한 대안: 메타 태그 대신 HTML 파일 업로드 방식도 가능하나, 코드베이스 관리 일관성을 위해 메타 태그 방식을 선택합니다.

---

## Tasks

- [ ] 네이버 서치어드바이저 사이트 등록 및 HTML 태그 검증 코드 발급
- [ ] `layout.tsx`의 `metadata.verification.other`에 `naver-site-verification` 태그 추가
- [ ] 배포 후 서치어드바이저에서 소유 확인 완료
- [ ] sitemap.xml 제출
- [ ] robots.txt의 네이버 크롤러(Yeti) 접근 허용 여부 확인

---

## Constraints

- 기존 Google 등 다른 검색엔진 소유 확인 방식과 충돌하지 않아야 합니다. (확인 필요: 현재 다른 verification 태그 없음)
- `robots.txt`에서 이미 정의된 `Disallow` 경로(`/auth/`, `/mypage` 등)는 변경하지 않습니다.
- 검증 코드는 공개 메타 태그 값으로, Secret으로 취급하지 않되 오입력 시 소유 확인이 실패하므로 정확히 반영해야 합니다.

---

## Definition of Done

- [ ] 기능 동작 확인 (네이버 서치어드바이저 소유 확인 완료 상태)
- [ ] 테스트 완료 (배포 후 실제 페이지 소스에 검증 태그 노출 확인)
- [ ] lint / typecheck 통과
- [ ] 문서 업데이트 (필요 시)
