export const DEFAULT_CURRENCY = "NGN";

export function normalizeCurrency(value?: string | null) {
  const code = String(value || "").trim().toUpperCase();
  return code || DEFAULT_CURRENCY;
}

export function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount === undefined || amount === null) return "No amount";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: normalizeCurrency(currency),
    maximumFractionDigits: 2,
  }).format(amount);
}
