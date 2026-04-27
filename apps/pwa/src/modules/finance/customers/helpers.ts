import { formatCurrency } from "@stanforte/shared";

export function asMoney(value: unknown, currency = "NGN") {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0, currency);
}

export function asDate(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return "-";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString();
}

export type PartyFormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_number: string;
  is_active: boolean;
};

export const emptyForm: PartyFormState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  tax_number: "",
  is_active: true,
};
