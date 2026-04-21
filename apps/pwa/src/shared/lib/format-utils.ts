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
  
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
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
  
  const refD = referenceDate
    ? (typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate)
    : d;
  const isSameDay = refD && !isNaN(refD.getTime())
    ? d.toDateString() === refD.toDateString()
    : true;
  
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  
  if (isSameDay || !refD || isNaN(refD.getTime())) {
    return timeStr;
  }
  
  const refDay = new Date(refD).toDateString();
  const currDay = d.toDateString();
  if (currDay !== refDay && d > refD) {
    return `${timeStr} +1 Day`;
  }
  
  return timeStr;
};

export const formatDuration = (minutes: number): string => {
  if (!minutes) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
