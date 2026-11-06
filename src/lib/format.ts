import type { Cents, ISODate } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 158000 -> "$1,580"; 12345 -> "$123.45". */
export function money(cents: Cents): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  const withCommas = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const text = rem === 0 ? `$${withCommas}` : `$${withCommas}.${String(rem).padStart(2, '0')}`;
  return negative ? `−${text}` : text;
}

/** Parses "YYYY-MM-DD" as a local calendar date (no time-zone shift). */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Whole calendar days from `from` until `to` (negative if `to` is past). */
export function daysBetween(from: ISODate, to: ISODate): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** "2026-09-14" -> "Sep 14, 2026" */
export function longDate(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "2026-09-14" -> "Sep 14" */
export function shortDate(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Human description of how far away a deadline is. */
export function timeLeft(deadline: ISODate, today: ISODate): string {
  const days = daysBetween(today, deadline);
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  return `${days} days left`;
}

/** Parses user-typed dollars ("1,126" or "$85.50") into cents, or null. */
export function parseDollars(text: string): Cents | null {
  const cleaned = text.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}
