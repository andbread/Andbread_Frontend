# llm-wiki 구조 설계 세션 기록

출처: Claude Code 세션 대화
작성자: shinhm21
확인 날짜: 2026-08-13

## 세션 목적

`llm-wiki` 폴더 신설을 위한 위치, 구조, 규칙 결정.

## 결정 사항

- `llm-wiki` 폴더는 저장소 루트에 둔다. `src/`는 앱 코드 전용이고 `e2e`, `.claude`, `supabase`도 루트에 독립 폴더로 존재하는 기존 구조를 따른 것이다.
- 폴더 구조는 `index.md`, `log.md`, `raw/`, `wiki/`, `output/` 3층 구조로 정했다. 안드레 카파시의 LLM위키 개념을 한글로 정리한 문서를 근거로 삼았다.
- `wiki/` 아래 `domain/` 하위 폴더를 넣을지 논의했으나, 문서 수가 아직 적어서 넣지 않기로 했다. 문서가 늘어나 찾기 불편해지면 그때 하위 폴더로 나누기로 했다.
- `index.md`는 최소 형태로 유지한다. 핵심 질문, 먼저 읽을 문서, 최근 산출물 정도만 담고 본문 내용은 담지 않는다. 내용을 많이 담으면 최신화 비용이 커지기 때문이다.
- `raw/`, `output/`은 빈 폴더 상태로도 git에 유지되도록 `.gitkeep`을 넣었다.
- `wiki/template.md`를 만들어 위키 문서 형식(한 문장 요약, 근거, 확인된 내용, 확인 필요)을 재사용할 수 있게 했다.
- 파일명·제목 규칙(`summary.md`, `notes.md` 같은 범용 이름 금지, kebab-case로 주제와 키워드 포함)은 처음엔 `AGENTS.md`에 넣었다가, 사용 시점에 바로 보이는 게 낫다는 판단으로 `wiki/template.md` 제목 아래 주석 한 줄로 옮겼다.
- `llm-wiki/AGENTS.md`, `llm-wiki/CLAUDE.md` 구성은 저장소 루트와 동일한 방식(`CLAUDE.md`에 `@AGENTS.md` 한 줄만 넣어 import)으로 맞췄다. 처음엔 실제 파일시스템 심볼릭 링크로 만들려 했으나 Windows에서 관리자 권한이 필요해 실패했고, 저장소 기존 `.claude/skills` 심볼릭 링크 방식(git이 mode 120000으로 추적하는 방식)도 검토했으나 최종적으로 import 방식을 선택했다.
- `AGENTS.md`의 오타(`/row` → `raw/`)를 수정했다.
- 문서 작성 시 명사형 종결 어미(`~임`, `~함`) 대신 완성된 문장으로 쓰는 규칙을 `AGENTS.md`에 유지하기로 했다.

## 세션 종료 시점 폴더 상태

```text
llm-wiki/
  index.md
  AGENTS.md
  CLAUDE.md
  raw/
    .gitkeep
    llm-wiki-structure-setup-session.md
  wiki/
    template.md
  output/
    .gitkeep
```

## 확인 필요

- `log.md` 작성 여부와 형식은 아직 정하지 않았다.
- `wiki/` 문서(엔빵 도메인 지식)는 아직 하나도 작성하지 않았다.
