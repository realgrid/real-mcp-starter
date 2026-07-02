const express = require('express');
const db = require('../db');
const { weeklyEndDate, weeklyStartDate } = require('../config');
const { toEpoch, formatRow } = require('../utils/date');

const router = express.Router();

function handleError(res, error) {
  console.error(error);
  res.status(500).json({ error: error.message });
}

router.get('/engagement/trend', (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 24, 52);
    const rows = db
      .prepare(
        `SELECT end_date, title, hours_viewed
         FROM (
           SELECT v.end_date,
                  m.title,
                  v.hours_viewed,
                  ROW_NUMBER() OVER (
                    PARTITION BY v.end_date
                    ORDER BY v.hours_viewed DESC, v.id ASC
                  ) AS rn
           FROM view_summary v
           INNER JOIN movie m ON m.id = v.movie_id
           WHERE v.duration = 'WEEKLY'
             AND v.movie_id IS NOT NULL
         )
         WHERE rn = 1
         ORDER BY end_date DESC
         LIMIT ?`
      )
      .all(limit);

    res.json(rows.map(formatRow));
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/engagement', (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT v.id as view_id, m.id as movie_id, v.view_rank, m.title, m.locale,
                v.hours_viewed, m.runtime, v.views, v.cumulative_weeks_in_top10, m.release_date
         FROM view_summary v
         INNER JOIN movie m ON m.id = v.movie_id
         WHERE v.duration = 'WEEKLY' AND v.end_date = ?
         ORDER BY
           CASE
             WHEN m.locale = 'en' THEN 0
             WHEN m.locale IS NULL OR m.locale = '' THEN 1
             ELSE 2
           END,
           m.locale,
           v.view_rank ASC`
      )
      .all(toEpoch(weeklyEndDate));

    res.json(rows.map(formatRow));
  } catch (error) {
    handleError(res, error);
  }
});

router.put('/views/:view_id', (req, res) => {
  try {
    const viewId = Number(req.params.view_id);
    const { views, hours_viewed } = req.body;

    if (views == null || hours_viewed == null) {
      return res.status(400).json({ error: 'views and hours_viewed are required' });
    }

    const result = db
      .prepare(
        `UPDATE view_summary
         SET views = ?, hours_viewed = ?, modified_date = ?
         WHERE id = ?`
      )
      .run(Number(views), Number(hours_viewed), Date.now(), viewId);

    if (result.changes === 0) {
      return res.status(404).json({ error: `view_summary record not found: ${viewId}` });
    }

    const updated = db
      .prepare(
        `SELECT v.id as view_id, m.id as movie_id, v.view_rank, m.title, m.locale,
                v.hours_viewed, m.runtime, v.views, v.cumulative_weeks_in_top10, m.release_date
         FROM view_summary v
         INNER JOIN movie m ON m.id = v.movie_id
         WHERE v.id = ?`
      )
      .get(viewId);

    res.json(formatRow(updated));
  } catch (error) {
    handleError(res, error);
  }
});

router.delete('/views', (req, res) => {
  try {
    const { view_ids: viewIds } = req.body;

    if (!Array.isArray(viewIds) || viewIds.length === 0) {
      return res.status(400).json({ error: 'view_ids array is required' });
    }

    const ids = [...new Set(viewIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];

    if (ids.length === 0) {
      return res.status(400).json({ error: 'valid view_ids are required' });
    }

    const placeholders = ids.map(() => '?').join(',');

    const deleteBulk = db.transaction(() => {
      const movieIds = db
        .prepare(
          `SELECT DISTINCT movie_id
           FROM view_summary
           WHERE id IN (${placeholders}) AND movie_id IS NOT NULL`
        )
        .all(...ids)
        .map((row) => row.movie_id);

      const result = db
        .prepare(`DELETE FROM view_summary WHERE id IN (${placeholders})`)
        .run(...ids);

      for (const movieId of movieIds) {
        const remaining = db
          .prepare('SELECT COUNT(*) AS cnt FROM view_summary WHERE movie_id = ?')
          .get(movieId);
        if (remaining.cnt === 0) {
          db.prepare('DELETE FROM movie WHERE id = ?').run(movieId);
        }
      }

      return result.changes;
    });

    const deletedCount = deleteBulk();

    res.json({ deleted: deletedCount, view_ids: ids });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/movie', (req, res) => {
  try {
    const { title, runtime, release_date, locale, original_title, available_globally } =
      req.body;

    if (!title || runtime == null || !release_date) {
      return res
        .status(400)
        .json({ error: 'title, runtime, and release_date are required' });
    }

    const now = Date.now();
    const movieId = db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM movie').get().id;
    const viewId = db
      .prepare('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM view_summary')
      .get().id;

    const insertMovie = db.prepare(
      `INSERT INTO movie (id, title, original_title, locale, runtime, release_date,
                          available_globally, created_date, modified_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertViewSummary = db.prepare(
      `INSERT INTO view_summary (id, movie_id, duration, start_date, end_date,
                                 views, hours_viewed, view_rank, cumulative_weeks_in_top10,
                                 created_date, modified_date)
       VALUES (?, ?, 'WEEKLY', ?, ?, 0, 0, 99, 0, ?, ?)`
    );

    const createMovieWithView = db.transaction(() => {
      insertMovie.run(
        movieId,
        title,
        original_title ?? null,
        locale ?? 'en',
        Number(runtime),
        toEpoch(release_date),
        available_globally != null ? (available_globally ? 1 : 0) : null,
        now,
        now
      );

      insertViewSummary.run(
        viewId,
        movieId,
        toEpoch(weeklyStartDate),
        toEpoch(weeklyEndDate),
        now,
        now
      );
    });

    createMovieWithView();

    const created = db
      .prepare(
        `SELECT v.id as view_id, m.id as movie_id, v.view_rank, m.title, m.locale,
                v.hours_viewed, m.runtime, v.views, v.cumulative_weeks_in_top10, m.release_date
         FROM view_summary v
         INNER JOIN movie m ON m.id = v.movie_id
         WHERE v.id = ?`
      )
      .get(viewId);

    res.status(201).json(formatRow(created));
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/seasons', (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT s.id, s.title as season_title, s.season_number, t.title as tv_show,
                s.runtime, s.release_date
         FROM season s
         LEFT JOIN tv_show t ON t.id = s.tv_show_id
         WHERE s.release_date >= ?
         ORDER BY t.title ASC, s.season_number ASC`
      )
      .all(toEpoch('2024-01-01'));

    res.json(rows.map(formatRow));
  } catch (error) {
    handleError(res, error);
  }
});

router.put('/seasons/:id', (req, res) => {
  try {
    const seasonId = Number(req.params.id);
    const { runtime } = req.body;

    if (runtime == null) {
      return res.status(400).json({ error: 'runtime is required' });
    }

    const result = db
      .prepare(
        `UPDATE season
         SET runtime = ?, modified_date = ?
         WHERE id = ?`
      )
      .run(Number(runtime), Date.now(), seasonId);

    if (result.changes === 0) {
      return res.status(404).json({ error: `season record not found: ${seasonId}` });
    }

    const updated = db
      .prepare(
        `SELECT s.id, s.title as season_title, s.season_number, t.title as tv_show,
                s.runtime, s.release_date
         FROM season s
         LEFT JOIN tv_show t ON t.id = s.tv_show_id
         WHERE s.id = ?`
      )
      .get(seasonId);

    res.json(formatRow(updated));
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
