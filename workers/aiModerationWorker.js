const pool = require('../db');
const OpenAI = require('openai');
//const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callAIForModeration({ body, rating }) {
  const sys = `Eres un moderador. Decide si una reseña debe APROBARSE o RECHAZARSE.
Criterios: sin insultos graves, sin odio, sin spam, sin datos sensibles. La crítica puede ser negativa.
Responde SOLO JSON con campos: approve (bool), score (0..1), reason (string breve en español).`;
  const usr = `Reseña: """${body}"""\nRating: ${rating}`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: usr }
    ],
  });

  const txt = resp.choices[0].message.content || '{}';
  let out = {};
  try { out = JSON.parse(txt); } catch {}
  return {
    approve: !!out.approve,
    score: Math.max(0, Math.min(1, Number(out.score) || 0)),
    reason: String(out.reason || '').slice(0, 500),
  };
}

async function processOnce(limit = 20) {
  const { rows: events } = await pool.query(
    `SELECT event_id, aggregate_id AS review_id, payload
       FROM outbox_event
      WHERE status='PENDING' AND type='ReviewNeedsModeration.v1'
      ORDER BY created_at ASC
      LIMIT $1`, [limit]
  );

  for (const ev of events) {
    try {
      const payload = typeof ev.payload === 'string' ? JSON.parse(ev.payload) : ev.payload;
      const { approve, score, reason } = await callAIForModeration({
        body: payload.body,
        rating: payload.rating,
      });

      const status = approve ? 'approved' : 'rejected';

      await pool.query(
        `UPDATE reviews
            SET status=$1,
                moderated_at=NOW(),
                moderation_label=$1,
                moderation_score=$2,
                moderation_reason=$3,
                moderation_source='ai',
                updated_at=NOW()
          WHERE id=$4`,
        [status, score, reason, ev.review_id]
      );

      await pool.query(`UPDATE outbox_event SET status='SENT', sent_at=NOW() WHERE event_id=$1`, [ev.event_id]);

      await pool.query(
        `INSERT INTO outbox_event (aggregate_type, aggregate_id, type, payload)
         VALUES ('review', $1, 'ReviewModerated.v1', $2::jsonb)`,
        [ev.review_id, JSON.stringify({ review_id: ev.review_id, status, score })]
      );

    } catch (e) {
      await pool.query(
        `UPDATE outbox_event
            SET retry_count = retry_count + 1
          WHERE event_id=$1`,
        [ev.event_id]
      );
      console.error('AI moderation failed for', ev.event_id, e.message);
    }
  }
}

function start(intervalMs = 3000) {
  setInterval(() => processOnce().catch(console.error), intervalMs);
}

module.exports = { start };
