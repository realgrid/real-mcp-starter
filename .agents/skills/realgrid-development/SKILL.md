---
name: realgrid-development
description: >-
  RealGrid 개발 지침 — realgrid-react 연동, 편집·저장 이벤트, row grouping,
  styleCallback, 집계. MCP 문서 보충·실수 방지. API는 real-mcp MCP (product: realgrid).
mcp:
  server: real-mcp
  product: realgrid
---

# RealGrid 개발 지침

RealGrid, 개발 문서는 **real-mcp MCP** (`product: realgrid`)에서 확인.  
MCP가 없으면 https://docs.realgrid.com (RealGrid2, `realgrid` npm)만 참고하고 **realgridjs(V1) 자료는 사용하지 않는다.**

이 Skill은 공식 문서·MCP **보충**과 **실수 방지**만 다룬다. 설치·기본 연동·컬럼 정의는 MCP React 튜토리얼을 따르고, 여기서 중복 서술하지 않는다.  
MCP 문서 조회·최종 응답 형식은 루트 [`AGENTS.md`](../../../AGENTS.md)를 따른다.

## RealGridReact — 문서 보충

React 연동은 MCP `tutorial-react-*` 튜토리얼(`realgrid-react`)을 기준으로 한다.

- **destroy**: `RealGridReact` unmount 시 내부에서 `grid.destroy()` → `provider.destroy()` 처리. **추가 cleanup 불필요.**
- **`onDestroy` prop**: destroy **직전** 훅(`beforeDestroy`). **`grid.destroy()` / `provider.destroy()` 호출 금지** — wrapper와 이중 destroy → `dispose` null 오류.
- **실행 환경**: React(`tsx`, `RealGridReact`)와 MCP **JS/바닐라 예제**는 연동 전제가 다르다. 연동·데이터 바인딩은 **`tutorial-react-*`** 기준. JS 예제는 API·옵션 참고만 (아래 「하지 말 것」).
- **레이아웃**: 그리드 컨테이너 부모에 **명시적 높이** (`flex: 1; min-height: 0` 등). 높이 0이면 그리드가 보이지 않음.
- **인스턴스 보관**: `GridView`를 React **`useState`에 넣지 않음**. `RealGridReact`용 `useRef`는 OK.
- **비동기 스키마 주의**: `rows`를 먼저 비동기로 받고 `fields/columns`를 동적으로 만드는 화면에서는, 스키마가 비어있는 첫 렌더에서 그리드를 먼저 mount하지 않도록 한다. `fieldNames.length > 0` 이후 렌더, `autoGenerateField` 사용, 또는 `onInitialized`에서 명령형(`setFields`/`setColumns`/`setRows`) 설정으로 초기화 타이밍을 고정한다.

## 편집 그리드 최소 옵션

공식 권장 설정은 MCP `/realgrid/guides/tutorial-recommended-grid-settings`. 최소: `sortMode`/`filterMode: "explicit"`, `gridView.editOptions.commitByCell = true`, `commitWhenLeave: true`.

## Fields / Columns

- 편집 이벤트 필드 식별: `provider.getOrgFieldName(field)` — `field`는 필드 **인덱스**(이름 아님).
- `column.fieldName`이 표시용일 때, 원본 값은 `grid.getValue` / `provider.getValue`로 **다른 field명** 사용.

## 스타일

- 동적 스타일: `styleCallback`(컬럼) / `setRowStyleCallback`(행) → **`{ styleName: 'css-class' }` 반환**.
- CSS 셀 클래스 (styleName과 조합):
  - 일반 데이터 셀: `.rg-data-cell.클래스명`
  - 그룹 푸터 셀: `.rg-rowgroup-footer-cell.클래스명`
  - 하단 footer 셀: `.rg-footer-cell.클래스명`
- **styleCallback 계열:** `setValue()` 등 **값 변경·무거운 작업 금지** (렌더 중 → 무한 루프·성능 저하). 읽기만.

## 편집 → DB 저장

- **일반(권장)**: `dataProvider.onRowStateChanged` — 행 상태(`CREATED`/`UPDATED`/…) 기준 DB 처리. 일괄 저장은 `grid.commit()` 후 `getAllStateRows`·`getJsonRow`.
- **셀 편집 즉시 DB 반영**: `gridView.onCellEdited` — `grid.getValue(itemIndex, fieldName)` (`getOrgFieldName(field)`로 필드 확인).
- **`oldValue`/`newValue` 필요**: `gridView.onEditRowChanged`.
- aggregate/footer 사용 시 `onEditRowChanged` 누락 가능 → `provider.onValueChanged` 백업.

편집 이벤트 순서: `onEditCommit` → `onEditRowChanged` → `onCellEdited`. `onEditCommit`은 반영 여부·검증용(`false`면 취소). **`onEditCommit`에서 fetch 금지.**

## Row Group + 집계

- `summaryMode: 'aggregate'`와 footer `visible: true` — footer/groupFooter `expression` 동작 조건.
- 행 그룹핑: `setRows` **이후** `groupBy`. (`setRows` 전에 `groupBy` 했다면 로드 후 재호출)
- `setRows`로 데이터 재로드 시 그룹 풀리면 `groupBy` 재호출.
- 그룹 푸터·집계·푸터 갱신: 셀/데이터 변경 후 `grid.refresh()`.

## 하지 말 것

| 금지                                                | 이유                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **JS/바닐라 MCP 예제를 React(`tsx`)에 그대로 적용** | **실행 환경 미고려** — JS는 단일 페이지·명령형 생명주기, React는 컴포넌트 mount/unmount·`StrictMode`·state. 연동은 `tutorial-react-*`, JS는 API·옵션만 |
| realgridjs(V1) API·예제 복사                        | GridView/LocalDataProvider와 비호환                                                                                                                    |
| GridView를 React state에 보관                       | 불필요 리렌더·인스턴스 꼬임                                                                                                                            |
| `RealGridReact` `onDestroy`에서 destroy 호출        | wrapper가 이미 destroy → 이중 destroy                                                                                                                  |
| `styleCallback` 안에서 `setValue()`                 | 렌더 루프·성능 문제                                                                                                                                    |
| 웹 검색 결과를 MCP 미확인으로 적용                  | V1 혼용·구버전 옵션명                                                                                                                                  |
