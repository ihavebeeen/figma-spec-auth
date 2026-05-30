// GET /api/auth-result?state=UUID

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['GET', key]),
  });
  if (!res.ok) throw new Error(`Redis error: ${res.status}`);
  const data = await res.json();
  if (!data.result) return null;
  return JSON.parse(data.result);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { state } = req.query;
    if (!state) return res.status(400).json({ error: 'Missing state parameter' });

    const data = await redisGet('auth:' + state);
    if (!data) return res.json({ found: false });

    return res.json({ found: true, user: data.user, isPaid: data.isPaid });
  } catch (err) {
    console.error('[auth-result]', err);
    return res.status(500).json({ error: err.message });
  }
};
