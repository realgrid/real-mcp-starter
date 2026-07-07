---
name: netflix-admin
description: >-
  RealGrid + RealChart 프로젝트 — 모든 에이전트 작업 전에 이 문서를 읽는다.
  API는 real-mcp MCP로 확인. 제품별 실무 지침은 .agents/skills/ 참고.
---

# Agent Instructions

**RealGrid·RealChart 프로젝트.** 구현·설명·버그 수정 모두 아래 순서를 따른다.

## 워크플로

1. **Skill 확인** — Skill Registry에서 해당 `SKILL.md`를 Read로 연다.
2. **API·옵션 확인** — 부족할 때만 **real-mcp MCP** (`product: realgrid` 또는 `realchart`)의 `search_resources` → 필요 시 `get_resource`. `query`는 아래 「query 작성」 절차를 따른다. 웹 검색·기억·`node_modules` 번들·`.d.ts` 분석에 의존하지 않는다.
3. **구현·수정** — Skill의 연동·이벤트·금지 사항을 따른다. MCP 스니펫·Skill 패턴으로 구현 가능하면 **그대로 적용**하고, 린트 에러는 해당 줄만 최소 수정한다.
4. **최종 응답** — MCP로 문서를 조회한 경우, 응답 **말미**에 참고 문서 링크와 근거 요약을 남긴다.

버그 수정도 동일하다. Skill과 코드를 먼저 대조하고, Playwright 등 E2E 도구로 디버깅하지 않는다. (사용자가 E2E 테스트 **작성**을 요청한 경우만 예외.)

### API 탐색 — 하지 말 것

MCP `search_resources` 스니펫과 Skill만으로 구현·설명이 가능하면 **추가 탐색을 하지 않는다.**

- **`node_modules` `.d.ts` 뒤지기 금지** — `realgrid/dist/main.d.ts` 등 대용량 타입 정의를 `grep`·`find`·전문 열람하지 않는다.
- **타입 에러** — MCP 예제 시그니처를 우선 따르고, 린트가 나면 **해당 줄만** 고친다 (예: `GridView` → `GridBase`, `cell.index?.itemIndex` optional chaining). 전체 `.d.ts`에서 타입을 “확정”하려 들지 않는다.
- **`.d.ts` 열람은 최후 수단** — MCP·Skill·프로젝트 기존 코드로 API·콜백 시그니처를 알 수 없을 때만, 필요한 심볼 **한두 개**만 짧게 확인한다.

## 공통 원칙

- 요청 범위 밖 코드는 수정하지 않는다.
- 기존 코드베이스의 네이밍·패턴을 따른다.
- 커밋·PR은 사용자가 명시적으로 요청할 때만 수행한다.

## Skill Registry

| 작업                          | Skill                                                                                            | MCP product |
| ----------------------------- | ------------------------------------------------------------------------------------------------ | ----------- |
| RealGrid (그리드·편집·그룹핑) | [`.agents/skills/realgrid-development/SKILL.md`](.agents/skills/realgrid-development/SKILL.md)   | `realgrid`  |
| RealChart (차트·대시보드)     | [`.agents/skills/realchart-development/SKILL.md`](.agents/skills/realchart-development/SKILL.md) | `realchart` |

## real-mcp 문서 조회

1. **`search_resources`** — RAG 검색. `query` 작성 전 아래를 순서대로 정리한다 (응답에 노출하지 않아도 됨).
   1. **의도** — 사용자가 구현하려는 것은? (한 문장)
   2. **맥락** — Skill·프로젝트에서 **이미 확인된** 키워드는? (`react`, `realgrid-react`, `필터` 등)
   3. **query** — `의도 + 맥락`을 짧은 질문 형태로 조합 (예: `React 그리드 컬럼 필터링, 초기값 지정`)
   4. **재검색** — 결과가 부족하면, 1차 스니펫·Skill에서 **확인된 API명만** 덧붙인다 (예: `… setColumnFilters`). 추측 API명은 1차에 넣지 않는다.
   - 스니펫만으로 구현 가능하면 **그대로 사용**하고 구현으로 넘어간다. 부족할 때만 `get_resource`.
2. **`list_resources` → `get_resource`** — 카테고리에서 문서를 골라 전문을 읽을 때. 스니펫으로 충분한데 `get_resource`로 전문을 읽지 않는다.

### 최종 응답 — MCP 문서 근거

MCP로 문서를 조회해 답변·구현한 경우, **최종 응답 말미**에 참고 문서를 남긴다.

- **문서 링크**: `get_resource`·`list_resources`의 `uri` → `https://gray-parrot.wooritech.com/api/v1` + uri (`.md` 접미사·`source` 필드 사용 금지)
- **근거 요약**: 해당 문서에서 따온 핵심 옵션·API·설정값 1~2문장 (가능하면 원문 표현 유지)
- **여러 문서**: 문서별 링크 + 한 줄 근거 목록
- MCP 미사용·고정 지침만 적용한 경우 생략
