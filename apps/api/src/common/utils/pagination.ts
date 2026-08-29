const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

export function sanitizePage(page?: number | string): number {
  const p = Number(page);
  if (!p || p < 1) return 1;
  return p;
}

export function sanitizeLimit(limit?: number | string): number {
  const l = Number(limit);
  if (!l || l < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(l, MAX_PAGE_SIZE);
}

export function paginate(page?: number | string, limit?: number | string) {
  const p = sanitizePage(page);
  const l = sanitizeLimit(limit);
  const skip = (p - 1) * l;
  return { page: p, limit: l, skip };
}
