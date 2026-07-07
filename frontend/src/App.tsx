import { useEffect, useRef, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import * as RealGrid from "realgrid";
import { RGDataColumn, RGDataField, RealGridReact } from "realgrid-react";
import "realgrid/dist/realgrid-style.css";
import NetflixTvShow from "./pages/NetflixTvShow";
import "./App.css";

type EngagementRow = {
  view_id: number;
  movie_id: number;
  view_rank: number;
  title: string;
  locale: string;
  hours_viewed: number;
  runtime: number;
  views: number;
  cumulative_weeks_in_top10: number;
  release_date: string | null;
};

const ENGAGEMENT_API = "/api/netflix/engagement";

const FIELDS: RealGrid.DataField[] = [
  { fieldName: "view_id", dataType: RealGrid.ValueType.NUMBER },
  { fieldName: "movie_id", dataType: RealGrid.ValueType.NUMBER },
  { fieldName: "view_rank", dataType: RealGrid.ValueType.NUMBER },
  { fieldName: "title", dataType: RealGrid.ValueType.TEXT },
  { fieldName: "locale", dataType: RealGrid.ValueType.TEXT },
  { fieldName: "hours_viewed", dataType: RealGrid.ValueType.NUMBER },
  { fieldName: "runtime", dataType: RealGrid.ValueType.NUMBER },
  { fieldName: "views", dataType: RealGrid.ValueType.NUMBER },
  {
    fieldName: "cumulative_weeks_in_top10",
    dataType: RealGrid.ValueType.NUMBER,
  },
  { fieldName: "release_date", dataType: RealGrid.ValueType.TEXT },
];

const COLUMNS: RealGrid.DataColumn[] = [
  {
    name: "view_rank",
    fieldName: "view_rank",
    width: 60,
    header: { text: "순위" },
  },
  {
    name: "title",
    fieldName: "title",
    width: 260,
    header: { text: "제목" },
  },
  {
    name: "locale",
    fieldName: "locale",
    width: 70,
    header: { text: "언어" },
  },
  {
    name: "hours_viewed",
    fieldName: "hours_viewed",
    width: 120,
    numberFormat: "#,##0",
    header: { text: "시청 시간(h)" },
  },
  {
    name: "runtime",
    fieldName: "runtime",
    width: 90,
    numberFormat: "#,##0",
    header: { text: "러닝타임(분)" },
  },
  {
    name: "views",
    fieldName: "views",
    width: 120,
    numberFormat: "#,##0",
    header: { text: "조회수" },
  },
  {
    name: "cumulative_weeks_in_top10",
    fieldName: "cumulative_weeks_in_top10",
    width: 110,
    numberFormat: "#,##0",
    header: { text: "TOP10 누적(주)" },
  },
  {
    name: "release_date",
    fieldName: "release_date",
    width: 110,
    header: { text: "개봉일" },
  },
];

const GRID_PROPS: RealGrid.ViewOptions = {
  display: {
    rowHeight: 36,
    emptyMessage: "표시할 데이터가 없습니다.",
  },
  header: { height: 40 },
};

function EngagementPage() {
  const gridRef = useRef<RealGridReact>(null);
  const [rows, setRows] = useState<EngagementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(ENGAGEMENT_API)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API 요청 실패 (${response.status})`);
        }
        return response.json() as Promise<EngagementRow[]>;
      })
      .then((data) => {
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="app-header">
        <h1>Netflix Admin</h1>
        <p>주간(WEEKLY) TOP 10 영화 — Engagement</p>
      </header>
      <main className="app-main">
        {loading && <p className="status-message">데이터를 불러오는 중…</p>}
        {error && <p className="status-message error">{error}</p>}
        {!error && (
          <div className="grid-container">
            <RealGridReact ref={gridRef} rows={rows} gridProps={GRID_PROPS}>
              {FIELDS.map((field) => (
                <RGDataField key={field.fieldName} {...field} />
              ))}
              {COLUMNS.map((column) => (
                <RGDataColumn key={column.name} {...column} />
              ))}
            </RealGridReact>
          </div>
        )}
      </main>
    </>
  );
}

function App() {
  return (
    <div className="app">
      <nav className="app-nav">
        <Link to="/">Engagement</Link>
        <Link to="/netflix-tvshows">TV 쇼 시즌</Link>
      </nav>
      <Routes>
        <Route path="/" element={<EngagementPage />} />
        <Route path="/netflix-tvshows" element={<NetflixTvShow />} />
      </Routes>
    </div>
  );
}

export default App;
