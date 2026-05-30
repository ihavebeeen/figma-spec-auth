// POST /api/auth-save
// Body: { state, user: { name, email }, isPaid }
// 인증 결과를 Upstash Redis에 10분간 저장

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisSet(key, value, ttlSeconds) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)]),
  });
  if (!res.ok) throw new Error(`Redis error: ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { state, user, isPaid = false } = req.body;

    if (!state || !user?.email) {
      return res.status(400).json({ error: 'Missing state or user.email' });
    }

    await redisSet(`auth:${state}`, { user, isPaid }, 600);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[auth-save]', err);
    return res.status(500).json({ error: err.message });
  }
}
