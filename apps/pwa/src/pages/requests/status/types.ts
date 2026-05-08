export type StatusTone =
  | "success"
  | "warning"
  | "pending"
  | "danger"
  | "neutral";

export type ViewerStatus = {
  label: string;
  hint: string;
  tone: StatusTone;
};

export type FinanceProgress = {
  label: string;
  hint: string;
};
