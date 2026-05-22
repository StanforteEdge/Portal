import type { RequestItemInput } from "@/pages/requests/requests-api";

export type FamilyFormHandle = {
  validateAndBuild: () => { payload: { team_id?: string; data: Record<string, unknown>; items?: RequestItemInput[] } } | { error: string };
};
