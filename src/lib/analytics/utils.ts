export function weekBounds(weeksAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export function monthBounds(monthsAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return kg.toFixed(0);
}

export function pctChange(
  current: number,
  prev: number
): { delta: string; positive: boolean } | null {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { delta: `${sign}${pct.toFixed(0)}%`, positive: pct >= 0 };
}

export function currentMondayISO(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}
