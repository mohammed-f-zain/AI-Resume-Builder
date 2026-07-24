/**
 * Normalize resume dates to a single display format for ATS consistency.
 * Target display: "MMM YYYY" (e.g. Jan 2024). Year-only stays "YYYY".
 */

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function monthLabel(monthIndex: number, locale: "en" | "ar"): string {
  if (monthIndex < 0 || monthIndex > 11) return "";
  return locale === "ar" ? AR_MONTHS[monthIndex] : EN_MONTHS[monthIndex];
}

function formatYearMonth(
  year: number,
  monthIndex: number,
  locale: "en" | "ar"
): string {
  const m = monthLabel(monthIndex, locale);
  if (!m) return String(year);
  return locale === "ar" ? `${m} ${year}` : `${m} ${year}`;
}

/**
 * Parse common resume date strings into a consistent display form.
 * Accepts: YYYY-MM, YYYY/MM, MM/YYYY, MM-YYYY, Month YYYY, Mon YYYY, YYYY.
 */
export function formatResumeDate(
  raw: string | undefined | null,
  locale: "en" | "ar" = "en"
): string {
  const v = (raw || "").trim();
  if (!v) return "";

  // Already "Present" / Arabic present — leave to caller
  const lower = v.toLowerCase();
  if (lower === "present" || lower === "current" || v === "حتى الآن") {
    return v;
  }

  // YYYY-MM or YYYY/MM
  let m = v.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    if (month >= 0 && month <= 11) return formatYearMonth(year, month, locale);
  }

  // MM/YYYY or MM-YYYY
  m = v.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m) {
    const month = Number(m[1]) - 1;
    const year = Number(m[2]);
    if (month >= 0 && month <= 11) return formatYearMonth(year, month, locale);
  }

  // Month YYYY / Mon YYYY
  m = v.match(/^([A-Za-z\u0600-\u06FF]+)\s+(\d{4})$/);
  if (m) {
    const year = Number(m[2]);
    const key = m[1].toLowerCase();
    if (key in MONTH_NAME_TO_INDEX) {
      return formatYearMonth(year, MONTH_NAME_TO_INDEX[key], locale);
    }
    // Arabic month name — find index
    const arIdx = AR_MONTHS.findIndex((name) => name === m![1]);
    if (arIdx >= 0) return formatYearMonth(year, arIdx, locale);
  }

  // Year only
  if (/^\d{4}$/.test(v)) return v;

  // Fallback: return trimmed original (editor free-text)
  return v;
}

/** Format `start – end` with consistent dates. */
export function formatResumeDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  current: boolean | undefined,
  presentLabel: string,
  locale: "en" | "ar" = "en"
): string {
  const start = formatResumeDate(startDate, locale);
  const end = current
    ? presentLabel
    : formatResumeDate(endDate, locale);
  return [start, end].filter(Boolean).join(" – ");
}
