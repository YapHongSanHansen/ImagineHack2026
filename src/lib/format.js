// Tiny shared helpers (no React).
export const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
export const pct = (n) => `${Math.round(n)}%`;
export const round = (n, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};
export const cn = (...xs) => xs.filter(Boolean).join(' ');
export const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
export const stdev = (arr) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
};
// tone helper for health-style numbers (higher = better)
export const healthTone = (score) => (score >= 75 ? 'good' : score >= 50 ? 'warn' : 'bad');
// tone helper for utilization (too low OR too high = bad)
export const utilTone = (u) => (u > 90 ? 'bad' : u < 40 ? 'warn' : 'good');
