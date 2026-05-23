import type { RequestItemInput } from "@/pages/requests/requests-api";

export type FamilyFormHandle = {
  validateAndBuild: () => { payload: { data: Record<string, unknown>; items?: RequestItemInput[]; total_amount?: number } } | { error: string };
};
