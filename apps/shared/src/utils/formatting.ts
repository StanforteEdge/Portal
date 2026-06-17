/**
 * Utility for consistent date and time formatting across the app.
 */

const locale = "en-GB"; // Or detect from browser

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
};

export const formatFullDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

export const formatTimeNextDay = (
  date: string | Date | null | undefined,
  referenceDate?: string | Date | null | undefined
): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  
  const formatted = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return formatted;
};

export const hasNextDay = (
  date: string | Date | null | undefined,
  referenceDate?: string | Date | null | undefined
): boolean => {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  
  if (!referenceDate) return false;
  const refD = typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate;
  if (isNaN(refD.getTime())) return false;
  
  return d.toDateString() !== refD.toDateString() && d > refD;
};

export const getDaysDifference = (
  date: string | Date | null | undefined,
  referenceDate?: string | Date | null | undefined
): number => {
  if (!date || !referenceDate) return 0;
  const d = typeof date === "string" ? new Date(date) : date;
  const refD = typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate;
  
  if (isNaN(d.getTime()) || isNaN(refD.getTime())) return 0;
  
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const refMidnight = new Date(refD.getFullYear(), refD.getMonth(), refD.getDate());
  
  const diffTime = dMidnight.getTime() - refMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

export const formatDuration = (minutes: number): string => {
  if (!minutes) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function formatDisplayDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
