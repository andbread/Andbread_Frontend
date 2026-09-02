---
GitHub Issues: https://github.com/andbread/Andbread_Frontend/issues/172
상태: 시작 전
이름: E2E 테스트 도입 구현 설계 v2 (세션 주입 기반 인증 전략)
---

<callout icon="📌" color="yellow_bg">
	이 문서는 <mention-page url="https://app.notion.com/p/392e7e8fdd12815c8c99e5a02785fa62"/>를 복제해 인증 전략을 개정한 v2입니다. 기존 문서는 폐기되었고, 이후 작업은 이 문서를 기준으로 진행합니다.
</callout>
### 0. 개정 배경 및 트레이드오프
#### 무엇이 바뀌었는가
기존 설계서는 Google·Kakao OAuth 로그인 자체를 각 Provider의 테스트 전용 계정으로 실제 인증 화면과 callback까지 실행해 검증하는 것을 전제로 했습니다. 이번 개정에서는 이 부분을 전면 수정해, 실제 Provider 로그인 화면은 자동화하지 않고 Supabase Admin API로 테스트 유저와 세션을 직접 생성해 브라우저에 주입하는 세션 주입 방식으로 대체했습니다.
#### 왜 바꾸었는가
- 소셜 로그인 버튼 클릭 이후의 화면은 Google과 Kakao가 렌더링하는 영역이라 우리 코드가 아니고, 그 화면이 바뀌어 테스트가 깨져도 우리가 고칠 수 있는 부분이 아니라 테스트 가치가 낮습니다.
- 우리 앱이 실제로 처리하는 로직은 로그인 콜백 이후, 즉 세션 확인, 유저 조회, 약관 동의 체크, 리다이렉트 분기입니다. 실제 버그도 대부분 이 구간에서 발생합니다.
- Google과 Kakao 모두 자동화된 브라우저의 로그인 시도를 탐지해 CAPTCHA를 띄우거나 로그인을 차단하는 경우가 많아, CI에서 안정적으로 돌리기 어렵고 반복 시도로 테스트 계정이 잠길 위험도 있었습니다.
#### 트레이드오프
- 세션 주입은 로그인 이후 로직 검증에는 강하지만, redirect URI 오설정이나 OAuth 클라이언트 설정 오류처럼 실제 Provider 연동 자체가 어긋나는 문제는 잡아내지 못합니다. 이 부분은 CI와 무관하게 낮은 빈도의 수동 확인으로 별도 보완합니다.
- Kakao OAuth 전용 검증 계정과 관련 작업은 더 이상 필요하지 않아 이번 개정에서 제외했습니다.
- feat→dev와 dev→main 두 CI 단계 모두 동일하게 세션 주입을 사용하되, 실행 범위만 다르게 구성합니다. feat→dev는 핵심 시나리오 위주로 빠르게 돌고, dev→main은 전체 회귀와 여러 화면 크기까지 넓혀서 돕니다.
### 1. 목적 (Why)
- 엔빵 서비스의 핵심 사용자 흐름을 Playwright 기반 E2E 테스트로 자동화
- 반복적으로 수동 확인해야 했던 기능 테스트 부담을 줄이고, 배포 전 주요 기능의 회귀 여부를 빠르게 확인
- 초대, 그룹 생성, 정산, 로그인 등 여러 조건이 얽힌 시나리오를 테스트 케이스로 문서화해 기능 안정성 확보
- GitHub Actions와 연동해 PR 또는 배포 전 자동 테스트를 실행할 수 있는 기반 마련
- 이후 Codex 또는 AI Agent가 구현한 변경사항을 검증할 수 있는 테스트 안전망 구축
### 2. 현재 문제 (Problem)
#### 기존 방식
- 주요 기능 검증을 개발자가 직접 브라우저에서 수동으로 확인
- 기능별 테스트 절차가 문서화되어 있지 않아 매번 기억에 의존해 확인
- 초대 기능처럼 여러 계정, 여러 상태, 여러 진입 경로가 필요한 기능은 테스트 비용이 높음
- 변경사항이 생겼을 때 기존 핵심 플로우가 깨졌는지 빠르게 확인하기 어려움
#### 기존 방식의 문제점
- 반복적인 수동 테스트로 인해 개발 속도가 느려짐
- 테스트 누락 가능성이 높음
- 초대 수락, 링크 초대, 친구 초대처럼 조건이 많은 기능은 회귀 버그를 발견하기 어려움
- AI Agent 또는 Codex를 활용해 구현할 경우, 사람이 직접 검증하기 전까지 변경 안정성을 판단하기 어려움
- PR 단위로 기능이 정상 동작하는지 자동 확인할 수 있는 기준이 없음
### 3. 목표 (Goal)
- Playwright 기반 E2E 테스트 환경 구축
- 서비스 핵심 사용자 흐름을 기준으로 테스트 시나리오 선정
- 테스트 케이스를 문서화해 자동화 우선순위 결정
- 핵심 시나리오부터 E2E 테스트 코드 작성
- GitHub Actions에서 E2E 테스트를 실행할 수 있도록 워크플로우 구성
- 실패 시 HTML report 또는 trace 등 디버깅 산출물을 확인할 수 있는 구조 마련
#### 이번 작업에서 해결하지 않는 범위
- 모든 기능의 E2E 테스트 자동화
- 단위 테스트, 통합 테스트 전면 도입
- 시각적 회귀 테스트 도입
- 성능 테스트 자동화
- 테스트 전용 DB 또는 seed 시스템의 완전한 고도화
- 모든 브라우저, 모든 디바이스 조합에 대한 테스트
### 4. 구현 방향 (Implementation)
- 먼저 핵심 사용자 흐름을 기준으로 E2E 테스트 시나리오를 선정
- 테스트 자동화 난이도와 중요도를 기준으로 우선순위 분류
- Playwright 설정 파일, 테스트 디렉토리, 공통 fixture, 인증 상태 관리 방식을 설계
- 소셜 로그인 버튼 클릭 이후의 실제 Provider 인증 화면은 우리 코드가 아니라 Google·Kakao가 렌더링하므로 자동화 대상에서 제외하고, 대신 Supabase Admin API로 테스트 유저와 세션을 직접 생성해 브라우저에 주입하는 세션 주입 방식을 채택
- 세션 주입으로 만든 로그인 상태는 그룹·초대·정산·채팅 등 로그인 이후 기능 테스트 전반에서 재사용
- 실제 검증 대상은 로그인 콜백 이후 로직인 세션 확인, 유저 조회, 약관 동의 체크, 리다이렉트 분기로 한정
- 신규 가입과 회원탈퇴는 Supabase Admin API로 테스트 유저를 생성하고 삭제하는 방식으로 매 실행마다 독립적으로 재현
- 실제 Provider 연동 자체의 오류는 세션 주입으로 잡히지 않으므로, CI와 별도로 낮은 빈도의 수동 확인을 안전망으로 유지
- 초대 기능처럼 2개 이상의 계정이 필요한 시나리오는 서로 다른 유저의 세션을 각각의 BrowserContext에 주입하는 방식으로 정의
- 초기에는 가장 중요한 1\~2개 플로우부터 자동화하고, 이후 도메인별로 점진적으로 확장
- GitHub Actions에서는 의존성 설치, Playwright 브라우저 설치, 테스트 실행, 리포트 업로드 순서로 구성
### 5. 검토한 대안 (Alternatives)
<table header-row="true">
<tr>
<td>대안</td>
<td>장점</td>
<td>단점</td>
<td>선택 여부</td>
</tr>
<tr>
<td>**Playwright 기반 E2E 테스트**</td>
<td>실제 브라우저 기반 사용자 흐름 검증 가능<br>로그인, 페이지 이동, 입력, 클릭, 네트워크 응답 등 실제 사용 시나리오 검증에 적합<br>GitHub Actions 연동과 HTML report, trace 등 디버깅 도구 활용 가능<br>Next.js 웹 서비스와 궁합이 좋음</td>
<td>테스트 작성과 유지보수 비용 발생<br>테스트 데이터, 인증 상태, 외부 의존성 관리가 필요<br>시나리오가 많아지면 실행 시간이 증가할 수 있음</td>
<td>**선택**</td>
</tr>
<tr>
<td>**수동 테스트 체크리스트만 유지**</td>
<td>도입 비용이 낮음<br>복잡한 설정 없이 바로 테스트 가능<br>초기 기획 단계에서는 빠르게 확인 가능</td>
<td>반복 비용이 크고 누락 가능성이 높음<br>PR 또는 배포 전 자동 검증이 불가능<br>AI Agent가 구현한 변경사항의 안정성을 자동으로 판단하기 어려움</td>
<td>**미선택**</td>
</tr>
<tr>
<td>**단위 테스트 우선 도입**</td>
<td>개별 함수나 컴포넌트 로직 검증에 유리<br>빠르게 실행 가능<br>디버깅 범위가 작음</td>
<td>실제 사용자 흐름 전체를 검증하기 어려움<br>초대, 로그인, 페이지 이동, DB 반영 등 복합 시나리오 검증에는 한계가 있음</td>
<td>**이번 작업에서는 미선택**</td>
</tr>
</table>
#### 최종 선택
- Playwright 기반 E2E 테스트를 선택
- 이번 작업의 핵심 목적은 단순 함수 검증이 아니라 사용자가 실제로 기능을 정상적으로 사용할 수 있는지 확인하는 것
- 수동 테스트 체크리스트는 자동화를 위한 테스트 케이스 문서화에 사용하고, 최종적으로는 핵심 플로우를 Playwright 테스트로 전환
### 6. 영향 범위 (Impact)
#### 기능 영향 범위
- 로그인 및 인증 흐름
- 그룹 생성 흐름
- 초대 생성 및 초대 수락 흐름
- 정산 상태 확인 또는 변경 흐름
- 핵심 페이지 진입 및 주요 CTA 동작
#### 코드 영향 범위
- Playwright 설정 파일
- E2E 테스트 디렉토리
- GitHub Actions workflow 파일
- Supabase Admin API 기반 세션 주입 helper 및 service role key 관리 구조
- 테스트 환경 변수 및 GitHub Actions Secrets
- 세션을 생성하고 주입하는 인증 setup 프로젝트
- 테스트에서 재사용할 fixture, helper, page object
- 가입·탈퇴 테스트 전후 엔빵 내부 사용자 상태를 보장하는 cleanup 유틸
- 필요 시 테스트용 seed 또는 추가 데이터 정리 유틸
- 실제 Provider 연동 확인을 위한 낮은 빈도 수동 점검 절차 문서
#### 회귀 테스트 필요 영역
- 로그인 후 주요 페이지 접근 가능 여부
- 그룹 생성 후 생성 결과 확인
- 초대 링크 또는 친구 초대 후 초대 수락 흐름
- 권한이 없는 사용자의 접근 제한
- 테스트 실행 후 데이터가 다음 테스트에 영향을 주지 않는지 확인
### 7. Task 분해 (Task Breakdown)
#### 1. 테스트 시나리오 선정
- 담당: ChatGPT
- 성격: 문서 작업
- 작업 내용
	- 핵심 사용자 흐름 목록화
	- 중요도와 자동화 난이도 기준으로 우선순위 분류
	- 1차 자동화 대상 시나리오 선정
- 완료 조건
	- 자동화 우선순위가 포함된 테스트 시나리오 목록 작성
#### 2. 테스트 케이스 문서화
- 담당: ChatGPT
- 성격: 문서 작업
- 작업 내용
	- 시나리오별 Given / When / Then 정리
	- 필요한 계정, 선행 데이터, 기대 결과 작성
	- 성공 케이스와 실패 케이스 분리
- 완료 조건
	- Codex가 테스트 코드 작성에 참고할 수 있는 테스트 케이스 문서 작성
#### 3. Playwright 도입 범위 및 워크플로우 설계
- 담당: ChatGPT
- 성격: 문서 작업
- 작업 내용
	- 테스트 디렉토리 구조 설계
	- fixture, helper, page object 도입 여부 결정
	- 인증 상태 재사용 방식 검토
	- Playwright MCP 활용 범위 확인
- 완료 조건
	- 테스트 코드 작성 전 구조와 운영 방식 정리
	- Playwright MCP 사용 여부 또는 사용 범위가 결정됨
#### 4. Playwright 기본 설정 추가
- 담당: Codex
- 성격: 코드 변경
- 작업 내용
	- Playwright 패키지 및 설정 파일 추가
	- 테스트 디렉토리 구성
	- baseURL, reporter, trace, screenshot, video 설정 검토
	- 로컬 테스트 실행 스크립트 추가
- 완료 조건
	- 로컬에서 기본 Playwright 테스트 실행 가능
#### 5. 인증 및 테스트 데이터 준비 구조 작성
- 담당: Codex
- 성격: 코드 변경
- 작업 내용
	- Supabase Admin API로 테스트 유저를 생성하고 세션을 발급하는 세션 주입 helper 작성
	- 발급받은 세션을 Playwright storageState 또는 addInitScript, addCookies로 브라우저에 주입하는 구조 구현
	- service role key는 Node.js 테스트 helper에서만 사용하고 브라우저 코드에는 노출되지 않도록 보호
	- 신규 가입·회원탈퇴 시나리오는 Admin API로 매 실행마다 새 테스트 유저를 생성하고 삭제하는 방식으로 구현
	- 테스트가 중간에 실패한 경우에도 Supabase Auth 사용자 및 관련 서비스 데이터를 정리할 수 있는 cleanup helper 작성
	- 초대·채팅 등 2인 시나리오를 위해 서로 다른 유저의 세션을 각각의 BrowserContext에 주입하는 방식 정의
	- feat→dev CI에서는 핵심 시나리오 위주로 빠르게, dev→main CI에서는 전체 회귀 범위로 넓혀 실행하도록 워크플로우 범위를 구분
	- 실제 Provider 연동 오류를 잡기 위한 낮은 빈도 수동 확인 절차를 별도로 문서화
- 완료 조건
	- 세션 주입만으로 로그인 이후 테스트인 그룹, 초대, 정산, 채팅 등을 반복 실행할 수 있음
	- 신규 가입과 회원탈퇴 시나리오를 실제 Google, Kakao 로그인 없이 Admin API 기반으로 매 실행마다 독립적으로 검증할 수 있음
	- 테스트 실패 후에도 다음 실행에 영향을 주는 사용자 및 관련 데이터가 남지 않음
	- feat→dev와 dev→main 각각의 CI 실행 범위가 문서에 명시되어 있음
#### 6. 핵심 E2E 테스트 코드 작성
- 담당: Codex
- 성격: 코드 변경
- 작업 내용
	- 1차 자동화 대상 테스트 작성
	- 그룹 생성, 초대, 정산 등 핵심 플로우 자동화
	- 필요한 helper 또는 page object 정리
- 완료 조건
	- 선정된 핵심 시나리오 테스트가 로컬에서 통과
#### 7. GitHub Actions E2E 테스트 워크플로우 추가
- 담당: Codex
- 성격: 코드 변경
- 작업 내용
	- GitHub Actions workflow 작성
	- 의존성 설치, Playwright 브라우저 설치, 테스트 실행 단계 구성
	- HTML report artifact 업로드 설정
	- 실행 트리거 범위 결정
- 완료 조건
	- PR 또는 지정된 브랜치에서 E2E 테스트 workflow 실행 가능
#### 8. 테스트 실행 및 안정화
- 담당: Codex
- 성격: 코드 변경
- 작업 내용
	- 로컬 및 CI 환경에서 테스트 실행
	- 실패 원인 분석 및 flaky 가능성 조정
	- 타임아웃, selector, 테스트 데이터 충돌 문제 수정
- 완료 조건
	- 핵심 E2E 테스트가 로컬과 CI에서 안정적으로 통과
### 8. Phase 및 의존성 (Phase & Dependency)
#### Phase 1. 테스트 범위 정의
- 포함 Task: 1, 2
- 목표: 자동화할 시나리오와 테스트 케이스 확정
- 의존성: 없음
- 산출물: 테스트 시나리오 목록, 테스트 케이스 문서
#### Phase 2. 테스트 구조 설계
- 포함 Task: 3
- 목표: Playwright 도입 방식과 테스트 운영 구조 결정
- 의존성: Phase 1 완료 필요
- 산출물: 테스트 디렉토리 구조, fixture/helper 전략, 인증 상태 관리 방식
#### Phase 3. Playwright 환경 구축
- 포함 Task: 4, 5
- 목표: 로컬에서 E2E 테스트를 작성하고 실행할 수 있는 기반 구축
- 의존성: Phase 2 완료 필요
- 예상 PR 범위: Playwright 설정, 테스트 스크립트, 인증/데이터 준비 구조
#### Phase 4. 핵심 시나리오 자동화
- 포함 Task: 6
- 목표: 우선순위가 높은 핵심 사용자 흐름 자동화
- 의존성: Phase 3 완료 필요
- 예상 PR 범위: 주요 E2E 테스트 코드, helper/page object 정리
#### Phase 5. CI 자동화 및 안정화
- 포함 Task: 7, 8
- 목표: GitHub Actions에서 E2E 테스트를 실행하고 실패 시 리포트를 확인할 수 있는 구조 구축
- 의존성: Phase 4 완료 필요
- 예상 PR 범위: GitHub Actions workflow, CI 테스트 안정화
### 9. GitHub Issue 생성 계획
현재 이 설계서는 GitHub Issue #172를 구체화하기 위한 문서입니다.
#### GitHub Issue 생성 기준
- 문서 작업은 Notion 설계서와 테스트 케이스 문서에서 관리
- 직접적으로 코드를 변경하는 작업은 GitHub Issue 또는 Subtask로 분리 가능
- 기존 #172가 이미 존재하므로, 이번 설계서 기준으로 #172의 제목을 수정하고 이후 작업을 추가 이슈로 분리
#### Notion에서 우선 관리할 작업
-
	1. 테스트 시나리오 선정
-
	1. 테스트 케이스 문서화
-
	1. Playwright 도입 범위 및 워크플로우 설계
#### GitHub Issue 또는 Subtask로 분리할 수 있는 작업
#### Issue 1. `[cicd-64/e2e] Playwright 기본 설정 추가`
- 연결 Task: 4. Playwright 기본 설정 추가
- 비고: 기존 GitHub Issue #172 제목 수정 예정
- 주요 작업
	- Playwright 설치 및 설정 파일 추가
	- 테스트 디렉토리 구성
	- 로컬 실행 스크립트 추가
- 완료 조건
	- 로컬에서 기본 E2E 테스트 실행 가능
#### Issue 2. `[test-67/e2e] 인증 및 테스트 데이터 준비 구조 작성`
- 연결 Task: 5. 인증 및 테스트 데이터 준비 구조 작성
- 주요 작업
	- Supabase Admin API 기반 세션 주입 helper 구현
	- 테스트 데이터 생성/정리 방식 구현
- 완료 조건
	- 세션 주입만으로 인증이 필요한 테스트 실행 가능
#### Issue 3. `[test-68/e2e] 핵심 사용자 플로우 E2E 테스트 작성`
- 연결 Task: 6. 핵심 E2E 테스트 코드 작성
- 주요 작업
	- 1차 자동화 대상 테스트 코드 작성
	- 그룹 생성, 초대, 정산 등 핵심 플로우 자동화
- 완료 조건
	- 핵심 시나리오 테스트가 로컬에서 통과
#### Issue 4. `[cicd-69/e2e] GitHub Actions E2E 테스트 워크플로우 추가`
- 연결 Task: 7. GitHub Actions E2E 테스트 워크플로우 추가
- 주요 작업
	- workflow 파일 작성
	- 브라우저 설치 및 테스트 실행 단계 구성
	- report artifact 업로드 설정
- 완료 조건
	- CI에서 E2E 테스트 실행 및 리포트 확인 가능
#### Issue 5. `[test-70/e2e] E2E 테스트 안정화 및 회귀 수정`
- 연결 Task: 8. 테스트 실행 및 안정화
- 주요 작업
	- flaky 테스트 원인 수정
	- selector, timeout, 데이터 충돌 문제 정리
- 완료 조건
	- 로컬과 CI에서 핵심 테스트 안정 통과
### 10. 완료 조건 (Definition of Done)
- E2E 테스트 시나리오와 테스트 케이스 문서화 완료
- Playwright 도입 범위와 테스트 운영 방식 결정
- Playwright 설정 및 로컬 실행 스크립트 추가
- 인증이 필요한 테스트를 위한 계정/상태 관리 방식 마련
- 핵심 사용자 플로우 E2E 테스트 작성
- GitHub Actions에서 E2E 테스트 자동 실행 가능
- 테스트 실패 시 report 또는 trace를 통해 원인 확인 가능
- 주요 테스트가 로컬과 CI에서 안정적으로 통과
### 11. 리스크 및 리뷰 포인트
#### 리스크
- 테스트 계정 또는 테스트 데이터가 실제 서비스 데이터와 충돌할 수 있음
- 초대 기능처럼 계정 2개 이상이 필요한 시나리오는 자동화 난이도가 높음
- service role key는 RLS를 우회하는 강한 권한이라 유출되거나 오남용되면 리스크가 큼
- 세션 주입은 로그인 이후 로직만 검증하므로 redirect URI 오설정 등 실제 Provider 연동 오류는 잡지 못함
- selector가 UI 변경에 취약하면 테스트 유지보수 비용이 커질 수 있음
- CI 환경에서 브라우저 의존성, 환경 변수, baseURL 설정 문제로 실패할 수 있음
#### 리뷰 포인트
- 테스트 시나리오가 실제 핵심 사용자 흐름을 잘 대표하는지 확인
- 테스트 데이터 생성 및 정리 방식이 안전한지 확인
- 세션 주입 방식과 service role key 관리가 보안상 문제가 없는지 확인
- 세션 주입으로 커버되지 않는 실제 Provider 연동 오류를 확인하는 수동 점검 절차가 마련되어 있는지 확인
- 테스트 selector가 지나치게 UI 구조에 의존하지 않는지 확인
- GitHub Actions에서 report artifact를 확인할 수 있는지 확인
- CI에서 테스트가 너무 오래 걸리지 않도록 범위가 적절한지 확인
### 12. 후속 작업
- E2E 테스트 시나리오 추가 확장
- React Query 도입 이후 데이터 fetching 흐름에 맞춘 테스트 보강
- API Route 마이그레이션 이후 API 기반 플로우 테스트 보강
- 테스트 전용 seed/cleanup 유틸 고도화
- 테스트 계정 관리 방식 개선
- 필요 시 시각적 회귀 테스트 또는 접근성 테스트 검토
### 참고 자료
- Playwright 공식 문서: Continuous Integration
- Playwright 공식 문서: Authentication
### 8. 테스트 전용 DB 환경 구성
#### 배경
E2E 테스트는 실제 브라우저에서 사용자 흐름을 검증하기 때문에 로그인, 그룹 생성, 초대 생성, 정산 정보 등록 등 DB 변경을 동반할 수 있다. 이때 운영 DB를 직접 사용하면 테스트 데이터가 운영 데이터에 섞이거나, 테스트 실패로 인해 운영 데이터가 오염될 위험이 있다.
따라서 Playwright E2E 테스트는 운영 Supabase 프로젝트가 아니라 테스트 전용 Supabase 프로젝트를 바라보도록 구성한다.
#### 기본 원칙
<table header-row="true">
<tr>
<td>원칙</td>
<td>설명</td>
</tr>
<tr>
<td>운영 DB와 테스트 DB 분리</td>
<td>E2E 테스트는 운영 Supabase 프로젝트에 접근하지 않는다.</td>
</tr>
<tr>
<td>테스트 DB는 migration으로 동기화</td>
<td>운영 DB를 수동으로 복사하지 않고, `supabase/migrations` 기준으로 동일한 스키마를 유지한다.</td>
</tr>
<tr>
<td>테스트 데이터는 테스트 DB에만 생성</td>
<td>로그인, 그룹 생성, 초대 생성, 만료 상태 조작 등은 테스트 DB에서만 수행한다.</td>
</tr>
<tr>
<td>민감한 키는 GitHub Secrets로 관리</td>
<td>Supabase URL, anon key, service role key, 테스트 계정 정보는 코드에 커밋하지 않는다.</td>
</tr>
<tr>
<td>생성 데이터 cleanup</td>
<td>테스트 중 생성한 그룹, 초대, 정산 데이터는 테스트 종료 후 정리한다.</td>
</tr>
</table>
#### 테스트 DB 구성 방식
테스트 전용 Supabase 프로젝트를 별도로 생성한다.
```plain text
andbread-prod  // 운영 Supabase 프로젝트
andbread-test  // E2E 테스트 전용 Supabase 프로젝트
```
DB 구조는 운영 DB를 복사해서 관리하지 않고, migration 파일을 기준으로 동기화한다.
```plain text
DB 스키마 변경 발생
→ migration 파일 생성
→ 로컬 DB 적용
→ 테스트 DB 적용
→ 운영 DB 적용
```
즉, 테스트 DB는 운영 DB의 복제본이 아니라 동일한 migration을 적용받는 별도 환경으로 관리한다.
#### GitHub Actions에서 테스트 DB 접근 방식
GitHub Actions는 테스트 전용 Supabase 접속 정보를 GitHub Secrets에서 읽어온다.
예상 Secrets:
```plain text
E2E_SUPABASE_URL
E2E_SUPABASE_ANON_KEY
E2E_SUPABASE_SERVICE_ROLE_KEY
```
소셜 로그인만 지원하는 서비스 특성상 이메일, 비밀번호 기반 테스트 계정은 별도로 두지 않고, service role key로 세션 주입에 필요한 테스트 유저를 그때그때 생성한다.
GitHub Actions 실행 시 해당 값을 환경변수로 주입한다.
```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
  E2E_TEST_MODE: true
```
이렇게 구성하면 CI 환경에서 실행되는 앱과 Playwright 테스트는 운영 DB가 아니라 테스트 DB만 사용한다.
#### Service Role Key 사용 주의사항
`SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회할 수 있는 강한 권한의 키이므로 다음 원칙을 지킨다.
- 코드에 직접 작성하지 않는다.
- 브라우저 코드에서 접근하지 않는다.
- GitHub Secrets 또는 로컬 `.env.test`에서만 관리한다.
- 테스트 helper처럼 Node.js 환경에서만 사용한다.
- `E2E_TEST_MODE=true`일 때만 실행되도록 보호 장치를 둔다.
#### 테스트 데이터 준비 방식
<table header-row="true">
<tr>
<td>방식</td>
<td>사용 시점</td>
<td>예시</td>
</tr>
<tr>
<td>세션 주입</td>
<td>로그인이 필요한 거의 모든 테스트</td>
<td>Admin API로 유저와 세션 생성 후 storageState 또는 쿠키로 주입</td>
</tr>
<tr>
<td>UI 조작</td>
<td>1차 핵심 플로우</td>
<td>로그인 후 그룹 생성, 그룹 상세 진입</td>
</tr>
<tr>
<td>API Helper</td>
<td>2차 복잡한 상태 기반 테스트</td>
<td>초대 링크 생성, 만료된 초대 생성, 이미 수락된 초대 생성</td>
</tr>
<tr>
<td>Seed</td>
<td>테스트 데이터 구성이 커졌을 때</td>
<td>여러 사용자, 그룹, 초대 상태를 한 번에 구성</td>
</tr>
</table>
초기에는 UI로 재현 가능한 핵심 플로우부터 자동화하고, 초대 만료처럼 특정 상태가 필요한 테스트는 테스트 DB와 API Helper 구조가 준비된 이후 확장한다.
#### Task 추가
#### 테스트 전용 Supabase 프로젝트 구성
- 담당: 사용자 또는 Codex 보조
- 성격: 환경 구성
- 작업 내용
	- 테스트 전용 Supabase 프로젝트 생성
	- 운영 DB 스키마와 동일한 migration 적용
	- 테스트 계정 생성
	- 테스트 환경변수 정리
- 완료 조건
	- 로컬과 CI에서 운영 DB가 아닌 테스트 DB를 바라볼 수 있음
#### GitHub Actions Secrets 설정
- 담당: 사용자
- 성격: 환경 설정
- 작업 내용
	- E2E 테스트용 Supabase URL, anon key, service role key 등록
	- 테스트 계정 이메일/비밀번호 등록
	- 운영 DB 관련 Secret과 혼동되지 않도록 이름 분리
- 완료 조건
	- GitHub Actions에서 테스트용 Supabase 프로젝트에 접근 가능
#### 테스트 데이터 helper 및 cleanup 구조 작성
- 담당: Codex
- 성격: 코드 변경
- 작업 내용
	- 테스트 데이터 생성 helper 작성
	- 테스트 중 생성한 데이터 cleanup helper 작성
	- helper가 테스트 환경에서만 실행되도록 보호 조건 추가
- 완료 조건
	- E2E 테스트 실행 후 테스트 데이터가 다음 테스트에 영향을 주지 않음