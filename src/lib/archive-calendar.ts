const BERLIN = "Europe/Berlin";

export function getBerlinDateParts(now: Date): { date: string; year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, year: Number(value.year), month: Number(value.month), day: Number(value.day) };
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function previousMonth(now: Date): string {
  const { year, month } = getBerlinDateParts(now);
  return month === 1 ? monthKey(year - 1, 12) : monthKey(year, month - 1);
}

export function nextMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return month === 12 ? monthKey(year + 1, 1) : monthKey(year, month + 1);
}

export function monthPeriod(value: string): { periodStart: string; periodEnd: string } {
  const [year, month] = value.split("-").map(Number);
  const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { periodStart: `${value}-01`, periodEnd: `${value}-${String(endDay).padStart(2, "0")}` };
}

export function shouldAttemptArchive(now: Date, state?: { attempts: number; lastAttemptDate?: string; processed: boolean }): boolean {
  const { day, date } = getBerlinDateParts(now);
  if (state?.processed || (state?.lastAttemptDate === date) || (state?.attempts ?? 0) >= 2) return false;
  return (day === 1 && (state?.attempts ?? 0) === 0) || (day === 2 && (state?.attempts ?? 0) < 2);
}
