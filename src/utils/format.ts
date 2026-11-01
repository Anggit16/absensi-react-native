/** Format angka & mata uang Rupiah (id-ID) tanpa ketergantungan Intl. */
export function formatNumber(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  const negative = rounded < 0;
  const digits = Math.abs(rounded).toString();
  let result = '';
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) result += '.';
    result += digits[i];
  }
  return negative ? `-${result}` : result;
}

export function formatCurrency(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}Rp ${formatNumber(Math.abs(rounded))}`;
}

/** Ringkas untuk kartu KPI: Rp 84,5 jt / Rp 1,2 M. */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  }
  if (abs >= 10_000) {
    return `Rp ${(value / 1_000).toFixed(0)} rb`;
  }
  return formatCurrency(value);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(fractionDigits).replace('.', ',')}%`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function daysLabel(days: number): string {
  return `${days} hari`;
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function parseNumberInput(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned ? Number(cleaned) : 0;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  if (name.length <= 2) return `${name[0] ?? ''}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}
