export const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export const MONTHS_ID_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

export const WEEKDAYS_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

export const WEEKDAY_INITIALS = ['S', 'S', 'R', 'K', 'J', 'S', 'M'] as const;

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function nowTime(): string {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.round(totalMinutes));
  return `${pad2(Math.floor(normalized / 60) % 24)}:${pad2(normalized % 60)}`;
}

export function addDays(iso: string, amount: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

export function addMonths(iso: string, amount: number): string {
  const date = parseISODate(iso);
  date.setMonth(date.getMonth() + amount);
  return toISODate(date);
}

/** Jumlah hari inklusif (asumsi demo: tanpa perhitungan hari libur nasional). */
export function inclusiveDays(startISO: string, endISO: string): number {
  const start = parseISODate(startISO).getTime();
  const end = parseISODate(endISO).getTime();
  if (end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

export function formatDate(iso: string): string {
  if (!iso) return '-';
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(iso: string): string {
  if (!iso) return '-';
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_ID_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateLong(iso: string): string {
  if (!iso) return '-';
  const date = parseISODate(iso);
  return `${WEEKDAYS_ID[date.getDay()]}, ${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDayName(iso: string): string {
  return WEEKDAYS_ID[parseISODate(iso).getDay()];
}

export function formatDateRange(startISO: string, endISO?: string): string {
  if (!endISO || endISO === startISO) return formatDate(startISO);
  return `${formatDate(startISO)} – ${formatDate(endISO)}`;
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  return `${MONTHS_ID[(month || 1) - 1]} ${year}`;
}

export function formatPeriodRange(period: string): string {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `1 – ${lastDay} ${MONTHS_ID[month - 1]} ${year}`;
}

export function periodOf(iso: string): string {
  return iso.slice(0, 7);
}

export function currentPeriod(): string {
  return todayISO().slice(0, 7);
}

export function shiftPeriod(period: string, amount: number): string {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function periodBounds(period: string): { start: string; end: string } {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${period}-01`, end: `${period}-${pad2(lastDay)}` };
}

/** Format waktu ISO datetime menjadi "12 Mei 2026 • 09:12". */
export function formatDateTime(isoDateTime: string): string {
  if (!isoDateTime) return '-';
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  return `${formatDate(toISODate(date))} • ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatTimeFromISO(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '-';
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function durationLabel(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 menit';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

export function relativeDays(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '-';
  const diff = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diff <= 0) return 'Hari ini';
  if (diff === 1) return '1 hari lalu';
  if (diff < 7) return `${diff} hari lalu`;
  if (diff < 30) return `${Math.floor(diff / 7)} minggu lalu`;
  return formatDate(toISODate(date));
}

/** Grid kalender dengan minggu dimulai Senin. */
export function buildCalendarMonth(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${pad2(month + 1)}-${pad2(day)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function startOfMonthISO(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function isFutureDate(iso: string): boolean {
  return iso > todayISO();
}

export function compareDate(a: string, b: string): number {
  return a.localeCompare(b);
}

export function overlapsRange(startISO: string, endISO: string, rangeStart: string, rangeEnd: string): boolean {
  return startISO <= rangeEnd && endISO >= rangeStart;
}
