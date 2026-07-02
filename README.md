# Netflix Admin

[Netflix Sample Database](https://github.com/lerocha/netflixdb) 데이터를 **RealGrid2**·**RealChart**로 조회·편집하는 데모 프로젝트입니다.  
Express API(포트 `3456`)와 React + Vite 프론트엔드(포트 `5173`)로 구성됩니다.

## 사전 준비

데모를 실행하려면 아래 두 가지를 먼저 준비해야 합니다.

### 1. Backend — SQLite DB

[lerocha/netflixdb](https://github.com/lerocha/netflixdb) 릴리스에서 SQLite 파일을 받아 백엔드에 배치합니다.

1. [Releases](https://github.com/lerocha/netflixdb/releases/latest) 페이지에서 **`netflixdb.sqlite`** 를 다운로드합니다.
2. `backend/data/` 디렉터리를 만들고 파일을 아래 경로에 둡니다.

   ```
   backend/data/netflixdb.sqlite
   ```

DB에는 `movie`, `tv_show`, `season`, `view_summary` 테이블이 포함되어 있습니다.

```bash
mkdir -p backend/data
curl -L -o backend/data/netflixdb.sqlite \
  https://github.com/lerocha/netflixdb/releases/latest/download/netflixdb.sqlite
```

### 2. Frontend — RealGrid / RealChart 라이선스

RealGrid2·RealChart는 라이선스 키가 필요합니다. 발급받은 키를 `frontend/public/js/` 아래 JS 파일로 준비합니다.

| 파일 | 전역 변수 | 발급 |
|------|-----------|------|
| `frontend/public/js/realgrid-lic.js` | `realGrid2Lic` | [RealGrid 지원 사이트](https://support.realgrid.com/projects/new) |
| `frontend/public/js/realchart-lic.js` | `realChartLic` | 우리테크 RealChart 라이선스 |

**realgrid-lic.js** 예시:

```js
var realGrid2Lic = "발급받은-라이선스-키";
```

**realchart-lic.js** 예시:

```js
var realChartLic = "발급받은-라이선스-키";
```

`index.html`에서 스크립트를 로드하거나, 코드에서 `RealGrid.setLicenseKey()` / `RealChart.setLicenseKey()`로 적용할 수 있습니다.

> 라이선스 파일은 `.gitignore`에 포함되어 저장소에 커밋되지 않습니다. 클론 후 각자 준비해야 합니다.

## 설치 및 실행

```bash
# 루트에서 의존성 설치 (npm workspaces: backend + frontend)
npm install

# 터미널 1 — API 서버 (http://localhost:3456)
npm run dev:backend

# 터미널 2 — 프론트엔드 (http://localhost:5173)
npm run dev:frontend
```

프론트엔드 Vite dev server는 `/api` 요청을 `http://localhost:3456`으로 프록시합니다.

## 프로젝트 구조

```
netflix-admin/
├── backend/
│   ├── data/
│   │   └── netflixdb.sqlite      # netflixdb 릴리스에서 준비 (git 제외)
│   └── src/
│       ├── server.js             # Express 진입점
│       ├── db.js                 # better-sqlite3 연결
│       ├── config.js
│       └── routes/netflix.js     # REST API
├── frontend/
│   ├── public/js/
│   │   ├── realgrid-lic.js       # RealGrid 라이선스 (git 제외)
│   │   └── realchart-lic.js      # RealChart 라이선스 (git 제외)
│   └── src/
│       └── App.tsx
└── package.json                  # workspace 루트
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/netflix/engagement` | 주간(WEEKLY) TOP 10 영화 목록 |
| `GET` | `/api/netflix/engagement/trend` | RealChart용 주차별 시청 추이 |
| `PUT` | `/api/netflix/views/:view_id` | 시청 지표(`views`, `hours_viewed`) 수정 |
| `DELETE` | `/api/netflix/views` | `view_summary` 벌크 삭제 |
| `POST` | `/api/netflix/movie` | 신작 영화 + 초기 view_summary 등록 |
| `GET` | `/api/netflix/seasons` | 2024년 이후 TV 시즌 목록 |

## 기술 스택

- **Backend:** Node.js, Express, better-sqlite3, cors
- **Frontend:** React 19, TypeScript, Vite, realgrid-react
- **Data:** [netflixdb](https://github.com/lerocha/netflixdb) (SQLite)

## 라이선스

- Netflix 샘플 DB: [Apache-2.0](https://github.com/lerocha/netflixdb/blob/main/LICENSE) (lerocha/netflixdb)
- RealGrid / RealChart: 우리테크 상용 라이선스 — [RealGrid 지원 사이트](https://support.realgrid.com/)에서 발급
