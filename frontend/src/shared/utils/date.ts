const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function parseVietnamDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatVietnamDate(value: string): string {
  const date = parseVietnamDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replace(/-/g, '/');
}

export function formatDayLabel(day: number, value: string): string {
  return `Ngày ${day} · ${formatVietnamDate(value)}`;
}

export function isValidVietnamDate(value: string): boolean {
  return parseVietnamDate(value) !== null;
}

export function addVietnamDays(value: string, days: number): string {
  const date = parseVietnamDate(value);
  if (!date) return value;
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days, 12),
  );
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(next)
    .replace(/-/g, '/');
}

export function getItineraryDateRange(value: string, duration: number): string {
  if (!isValidVietnamDate(value)) return '';
  if (duration < 2) return formatVietnamDate(value);
  return `${formatVietnamDate(value)} – ${addVietnamDays(value, duration - 1)}`;
}
