---
name: realgrid-development
description: >-
  RealGrid 개발 지침 — realgrid-react 연동, 편집·저장 이벤트, row grouping,
  styleCallback, 집계. MCP 문서 보충·실수 방지. API는 real-mcp MCP (product: realgrid).
---

# RealGrid 개발 지침

공식 문서는 **real-mcp MCP** (`product: realgrid`). MCP가 없으면 https://docs.realgrid.com (RealGrid2, `realgrid`, `realgrid-react` npm)만 사용하고 **realgridjs(V1)은 쓰지 않는다.**

이 Skill은 공식 문서 **보충**과 **자주 틀리는 부분**만 정리한다. API·옵션은 MCP **키워드 검색**으로 확인하고, 스니펫만으로 구현 가능하면 추가 탐색·node_modules 분석은 하지 않는다.

## RealGridReact

- MCP JS/바닐라 예제는 API·옵션 이름 참고만 하고, 생명주기 코드는 그대로 복사하지 않는다.
- unmount 시 wrapper가 `grid.destroy()` → `provider.destroy()`를 호출한다. **추가 cleanup 불필요.** `onDestroy`에서 destroy를 다시 호출하면 이중 destroy 오류.
- `GridView` 인스턴스를 React **`useState`에 넣지 않는다.** `useRef<RealGridReact>`로 접근 (`gridRef.current.gridView`).
- 그리드 부모 컨테이너에 **명시적 높이**가 있어야 한다 (`flex: 1; min-height: 0` 등). 높이 0이면 그리드가 보이지 않는다.
- fields/columns를 비동기로 받는 화면은, 스키마가 비어 있는 첫 렌더에서 mount하지 않는다. `fieldNames.length > 0` 이후 렌더하거나 `autoGenerateField`를 쓴다.

## React — 초기화·타이밍

`realgrid-react`는 **mount 시점**에 prop과 `RGDataColumn` 자식을 그리드에 반영한다.  
같은 기능을 `onInitialized`, prop, `useEffect`에 **나눠 두면** 콜백이 안 붙거나, 두 번 등록되거나, `gridViewRef`가 null인 채 effect가 도는 경우가 있다.

**역할을 나눈다.**

- **행 동적 스타일** — `RealGridReact`의 **`rowStyleCallback` prop** 한 곳. 컴포넌트 밖 상수나 `useCallback`으로 정의. wrapper가 mount 시 `setRowStyleCallback`을 호출한다.
- **컬럼 동적 스타일** — `COLUMNS` 정의 또는 `RGDataColumn`의 **`styleCallback`**. `onInitialized`에서 `columnByName(...).styleCallback = …` 하지 않는다. `RGDataColumn`은 mount가 늦어서 그 시점엔 컬럼이 없을 수 있다.
- **필터·groupBy 등 rows에 의존하는 설정** — `useEffect`에서 `gridRef.current?.gridView`로 접근, **`[rows]`(또는 rows 의존 state) 변경 후** 실행. 스타일 콜백과 섞지 않는다.
- **편집·저장 이벤트** — `RealGridReact` prop(`onEditRowChanged`, `onCellEdited` 등) **또는** `onInitialized`에서 `grid.on…` / `provider.on…` 연결. **둘 중 한 곳만.** wrapper는 mount/update 시 `on*` prop을 `$_connectEvents`로 grid·provider에 붙인다. `onInitialized`에서 같은 이벤트를 다시 할당하면 prop 연결이 **덮어씌워진다.**
- **`onInitialized`** — 그리드가 생성된후 발생하는 콜백. prop을 활용하지 않고 기존 js 방식으로 구성할 때 이용 가능. 여기서 ref를 잡아 `useEffect`로 스타일·필터를 다시 거는 패턴은 피한다.

```tsx
// OK: 스타일은 prop, rows 의존 작업은 effect
<RealGridReact ref={gridRef} rows={rows} rowStyleCallback={globalRowStyle} />
useEffect(() => {
  const grid = gridRef.current?.gridView;
  if (!grid || rows.length === 0) return;
  applyLocaleFilters(grid, rows);
}, [rows]);

// NG: 같은 스타일을 onInitialized + prop + effect에 중복
onInitialized={(g) => { gridViewRef.current = g; g.setRowStyleCallback(...); }}
<RealGridReact rowStyleCallback={...} onInitialized={...} />

// NG: 같은 이벤트를 prop과 onInitialized에 동시에
<RealGridReact onCellEdited={handleCellEdited} onInitialized={(g) => { g.onCellEdited = ...; }} />
```

## 스타일

React에서 콜백을 **어디에** 둘지 → 위 「React — 초기화·타이밍」. `styleName`/`style` API는 MCP 키워드(`rowStyleCallback`, `styleCallback`, `styleName`)로 확인.

**자주 틀리는 것**

- **`rowStyleCallback`의 `styleName`** — RealGrid가 행의 각 셀에 클래스를 붙인다. CSS는 **`.global-content-row { … }`**처럼 사용자 클래스만 정의하면 된다. **`.rg-data-cell` 아래·앞에 행 스타일을 매달지 않는다** (예: `.rg-data-cell.global-content-row` — 셀 테마 선택자와 행 `styleName`을 섞은 오해).
- **`.rg-data-cell`** — 데이터 셀 영역의 **유효한** RealGrid 테마 클래스. `realgrid-style.css` 커스터마이즈·specificity 조정에 쓸 수 있다. 행/컬럼 `styleName`과는 별개.
- 푸터·그룹푸터 등 다른 영역은 각각 `rg-footer-cell`, `rg-rowgroup-footer-cell` 등 해당 영역 클래스를 쓴다.
- 콜백 안 `setValue()`·fetch 등 값 변경·무거운 작업 금지.

## 편집·저장

- **일반(권장):** `dataProvider.onRowStateChanged` — 행 상태(`CREATED`/`UPDATED`/…) 기준으로 DB 처리. 일괄 저장은 `grid.commit()` 후 `getAllStateRows`·`getJsonRow`.
- **셀 편집 즉시 DB 반영:** `gridView.onCellEdited` — `grid.getValue(itemIndex, fieldName)`.
- **oldValue/newValue 필요:** `gridView.onEditRowChanged`.
- 이벤트 순서: `onEditCommit` → `onEditRowChanged` → `onCellEdited`. `onEditCommit`은 검증·취소(`false`)용 — **여기서 fetch 하지 않는다.**
- 편집 이벤트의 `field`는 이름이 아니라 **필드 인덱스**. 원본 필드명은 `provider.getOrgFieldName(field)`.

## Row Group + 집계

- `summaryMode: 'aggregate'`와 footer `visible: true` — footer/groupFooter `expression`이 동작하는 전제.
- `setRows` **이후** `groupBy`를 호출한다. `setRows`로 재로드하면 그룹이 풀릴 수 있으므로 `groupBy`를 다시 호출하고, 셀 변경 후 `grid.refresh()`로 푸터를 갱신한다.

## 하지 말 것

- JS/바닐라 MCP 예제를 React(`tsx`)에 그대로 적용 (mount/unmount·StrictMode 미고려)
- realgridjs(V1) API·예제, GridView를 React state에 보관, `onDestroy`에서 destroy 재호출
- `styleCallback` / `rowStyleCallback` 안에서 `setValue()` 등 값 변경 (위 「스타일」)
- **`onInitialized` + `rowStyleCallback` prop + `useEffect`로 스타일·필터 혼합** (위 「React — 초기화·타이밍」)
- **같은 편집·저장 이벤트를 prop과 `onInitialized`에 동시에** (한쪽이 덮어씀)
- **`onInitialized`에서 `columnByName(...).styleCallback` 설정**
- MCP 미확인 웹 검색 (V1·구버전 옵션 혼입)
