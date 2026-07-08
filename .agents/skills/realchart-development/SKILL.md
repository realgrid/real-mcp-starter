---
name: realchart-development
description: >-
  RealChart 개발 지침 — 차트 config, realchart-react 연동, 라이선스·import,
  API는 real-mcp MCP (product: realchart).
---

# RealChart 개발 지침

API·차트 config·예제는 **real-mcp MCP** (`product: realchart`)에서 확인.  
MCP가 없으면 https://www.realchart.co.kr 문서만 참고한다.

MCP 문서 조회·최종 응답 형식은 루트 [`AGENTS.md`](../../../AGENTS.md)를 따른다.

## 설치·라이선스·import

- npm: `realchart`, React 래퍼 `realchart-react`
- CSS: `import 'realchart/realchart-style.css'` (`dist/` 경로 아님)
- 모듈 import: `import * as RealChart from 'realchart'` — **default export 없음**
- 라이선스: RealGrid와 동일 패턴 — `index.html`에 `/js/realchart-lic.js` 로드 후 `RealChart.setLicenseKey(window.realChartLic)` (모듈 import 직후 1회 호출 권장)
- 다크 UI: config `chart: { theme: 'dark' }` — 기본 `.rct-control` 배경은 `#fff`이므로 theme 미지정 시 흰 패널만 보일 수 있음

## React (`realchart-react`)

공식 패턴 그대로 사용한다. RealChart는 컨테이너 크기 변경을 **내장 `ResizeObserver`**(`chart.resizeDelay`, 기본 50ms)로 처리하므로, React 쪽에 별도 `ResizeObserver`·`canMount` 지연을 두지 않는다.

```jsx
import * as RealChart from "realchart";
import { RealChartReact } from "realchart-react";

// 데이터 준비 후 마운트. 패널 높이는 CSS(grid/flex min-height)가 보장.
{
  rows.length > 0 && (
    <RealChartReact
      id="my-chart"
      realchart={RealChart}
      config={config}
      w="100%"
      h="100%"
    />
  );
}
```

- **컨테이너 높이** — CSS grid/flex로 `min-height`를 지정. RealChartReact는 `w="100%"` `h="100%"`.
- **데이터 로드 후 마운트** — 빈 config로 `createChart` 호출 방지.
- **`import * as RealChart`** — npm ESM(`1.4.x`)은 default export 없음. 공식 문서의 `import RealChart from 'realchart'`와 불일치.
- **`animate` prop 사용 금지** — `realchart-react` v0.0.x는 prop을 DOM `<div>`로 전달·`createChart`에도 미전달. 애니메이션은 `chart: { animatable: true }`(기본값 `true`).
- **외부 `ResizeObserver` + `canMount` 금지** — RealChart 내장 resize와 중복·`setState` 루프로 멈춤 유발 가능.

## 차트 구성 요약

- 가로 막대: `inverted: true` + bar 시리즈 — **config 축 역할은 세로 막대와 동일** (아래 §inverted 참고)
- 도넛 파이: `series.type: 'pie'`, `innerRadius` 지정
- 라인 추이: `series.type: 'line'`, `marker.visible: true`
- Pie·Line 등 축 불필요 시리즈는 xAxis/yAxis 생략 가능

## `inverted: true` — 축 config 자주 틀리는 부분

`inverted`는 **화면에 그리는 방향만** 바꾼다. config에서 **어느 축에 카테고리·값을 넣을지는 바꾸지 않는다.**

| config 역할                         | Bar 시리즈 (세로·가로 공통)                    |
| ----------------------------------- | ---------------------------------------------- |
| `xAxis.categories`                  | 카테고리(라벨) — 영화 제목, 연도 등            |
| `yAxis` (+ `label.numberFormat` 등) | 값(숫자) 축 — 시청 시간, 건수 등               |
| `inverted: true`                    | 위 설정 **그대로** 두고 막대만 **가로**로 표시 |

**흔한 실수:** 가로 막대를 만들려고 `inverted: true`를 켠 뒤, “가로니까 카테고리를 yAxis에” 넣는 것.

```js
// ❌ 잘못 — categories를 yAxis로 옮김 → 데이터·축 매핑 어긋남, createChart 예외·페이지 크래시 가능
{
  inverted: true,
  xAxis: { label: { numberFormat: "#,##0" } },
  yAxis: { categories: ["영화 A", "영화 B"] },
  series: { type: "bar", data: [100, 80] },
}

// ✅ 올바름 — 세로 막대와 동일한 축 config + inverted만 추가
{
  inverted: true,
  xAxis: { categories: ["영화 A", "영화 B"] },
  yAxis: { label: { numberFormat: "#,##0" } },
  series: { type: "bar", data: [100, 80] },
}
```

- **검증:** config 작성 후 “카테고리가 `xAxis.categories`에 있는가?”만 확인. `inverted` 여부와 무관.
- **순서:** 가로 막대에서 위→아래 표시 순서는 `xAxis.categories` 배열 순서·`yAxis.reversed` 등으로 조정. 카테고리 축 자체를 yAxis로 옮기지 않는다.
- **React:** `RealChartReact`는 마운트 시 `createChart(config)`를 동기 호출한다. 잘못된 축 config는 **렌더 예외 → 페이지 크래시**로 이어질 수 있다.

## 하지 말 것

| 금지                                              | 이유                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `inverted: true`일 때 categories를 `yAxis`로 이동 | Bar는 config상 항상 `xAxis`=카테고리. 시각만 invert됨                              |
| `<RealChartReact animate />`                      | v0.0.x 래퍼 버그로 DOM에 boolean `animate` 전달·React 경고                         |
| 외부 `ResizeObserver` + `canMount`로 마운트 지연  | RealChart 내장 resize와 중복·`setState` 루프로 UI 멈춤 가능                        |
| `useEffect(..., [config])`로 create/destroy 반복  | 무한 루프·무한 로딩처럼 보이는 UI 멈춤                                             |
| 컨테이너 높이 미지정 상태에서 `h="100%"`만 사용   | CSS `min-height` 없으면 높이 0 → 빈 패널                                           |
| `import RealChart from 'realchart'`               | npm ESM default export 없음 — 빌드 실패                                            |
| `realchart/dist/realchart-style.css`              | 패키지 경로 불일치 — `realchart/realchart-style.css` 사용                          |
| Pie `pointLabel.text: '${y}%'`에 절대값 y 사용    | y가 합계·비율이 아니면 포맷 오류. `textCallback`으로 % 계산                        |
| Highcharts·ECharts 등 **타 차트** 툴팁 문법       | RealChart 변수·포맷과 다름. `${category}`, `${y:#,##0}`, `${pct:.1f}` 등 사용 금지 |
