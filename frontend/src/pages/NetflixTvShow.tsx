import { useEffect, useRef, useState } from "react";
import * as RealGrid from "realgrid";
import { RGDataColumn, RGDataField, RealGridReact } from "realgrid-react";
import "realgrid/dist/realgrid-style.css";

type SeasonRow = {
  id: number;
  tv_show: string;
  season_title: string;
  season_number: number;
  runtime: number;
};

const SEASONS_API = "/api/netflix/seasons";

const FIELDS: RealGrid.DataField[] = [
  { fieldName: "id", dataType: RealGrid.ValueType.NUMBER },
  { fieldName: "tv_show", dataType: RealGrid.ValueType.TEXT },
  { fieldName: "season_title", dataType: RealGrid.ValueType.TEXT },
  { fieldName: "season_number", dataType: RealGrid.ValueType.NUMBER },
  { fieldName: "runtime", dataType: RealGrid.ValueType.NUMBER },
];

const COLUMNS: RealGrid.DataColumn[] = [
  {
    name: "id",
    fieldName: "id",
    width: 80,
    header: { text: "시즌ID" },
  },
  {
    name: "tv_show",
    fieldName: "tv_show",
    width: 220,
    header: { text: "드라마명" },
  },
  {
    name: "season_title",
    fieldName: "season_title",
    width: 260,
    header: { text: "시즌제목" },
  },
  {
    name: "season_number",
    fieldName: "season_number",
    width: 90,
    numberFormat: "#,##0",
    header: { text: "시즌번호" },
  },
  {
    name: "runtime",
    fieldName: "runtime",
    width: 110,
    numberFormat: "#,##0",
    header: { text: "러닝타임(분)" },
  },
];

const GRID_PROPS: RealGrid.ViewOptions = {
  display: {
    rowHeight: 36,
    emptyMessage: "표시할 데이터가 없습니다.",
  },
  header: { height: 40 },
};

export default function NetflixTvShow() {
  const gridRef = useRef<RealGridReact>(null);
  const [rows, setRows] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(SEASONS_API)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API 요청 실패 (${response.status})`);
        }
        return response.json() as Promise<SeasonRow[]>;
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
        <p>넷플릭스 TV 쇼 시즌 현황</p>
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
