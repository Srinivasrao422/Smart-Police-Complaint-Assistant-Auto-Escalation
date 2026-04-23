const WINDOW_MS = parseInt(process.env.RATE_WINDOW_MS || '60000', 10); // default 1 min
const MAX = parseInt(process.env.RATE_MAX || '200', 10);
const hits = new Map();

function cleanup() {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now - entry.start > WINDOW_MS) hits.delete(ip);
  }
}

setInterval(cleanup, WINDOW_MS).unref();

module.exports = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  hits.set(ip, entry);
  if (entry.count > MAX) return res.status(429).json({ success: false, error: { message: 'Too many requests' } });
  next();
};
