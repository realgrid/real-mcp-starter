---
name: netflix-admin
description: >-
  RealGrid + RealChart 프로젝트 — 모든 에이전트 작업 전에 이 문서를 읽는다.
  API는 real-mcp MCP로 확인. 제품별 실무 지침은 .agents/skills/ 참고.
mcp:
  server: real-mcp
---

# Agent Instructions

**RealGrid·RealChart 프로젝트.** 구현·설명·버그 수정 모두 아래 순서를 따른다.

## 워크플로

1. **Skill 확인** — Skill Registry에서 해당 `SKILL.md`를 Read로 연다.
2. **API·옵션 확인** — 부족할 때만 **real-mcp MCP** (`product: realgrid` 또는 `realchart`)의 `search_resources` → 필요 시 `get_resource`. 웹 검색·기억·`node_modules` 번들 분석에 의존하지 않는다.
3. **구현·수정** — Skill의 연동·이벤트·금지 사항을 따른다.
4. **최종 응답** — MCP로 문서를 조회한 경우, 응답 **말미**에 참고 문서 링크와 근거 요약을 남긴다.

버그 수정도 동일하다. Skill과 코드를 먼저 대조하고, Playwright 등 E2E 도구로 디버깅하지 않는다. (사용자가 E2E 테스트 **작성**을 요청한 경우만 예외.)

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

1. **`search_resources`** — RAG 검색. 스니펫만으로 구현 가능하면 **그대로 사용**. 부족할 때만 `get_resource`.
2. **`list_resources` → `get_resource`** — 카테고리에서 문서를 골라 전문을 읽을 때.

### 최종 응답 — MCP 문서 근거

MCP로 문서를 조회해 답변·구현한 경우, **최종 응답 말미**에 참고 문서를 남긴다.

- **문서 링크**: `get_resource`·`list_resources`의 `uri` → `https://gray-parrot.wooritech.com/api/v1` + uri (`.md` 접미사·`source` 필드 사용 금지)
- **근거 요약**: 해당 문서에서 따온 핵심 옵션·API·설정값 1~2문장 (가능하면 원문 표현 유지)
- **여러 문서**: 문서별 링크 + 한 줄 근거 목록
- MCP 미사용·고정 지침만 적용한 경우 생략

## 다른 RealGrid 프로젝트에 복사

| 범위        | 복사 대상                                               |
| ----------- | ------------------------------------------------------- |
| 저장소      | `AGENTS.md`, `.agents/skills/`                          |
| 사용자 전역 | `~/.cursor/` 등 에이전트 설정에서 `AGENTS.md` 경로 지정 |
