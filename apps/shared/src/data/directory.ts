// apps/shared/src/data/directory.ts

export type DirectoryItem = {
  id: string;
  name: string;
  subtitle?: string;
  type?: string;
  meta?: any;
};

/**
 * Shared logic for populating data directories (Users, Teams, Orgs)
 */
export const DirectoryKeys = {
  ORGANIZATIONS: "directory:organizations",
  TEAMS: "directory:teams",
  EMPLOYEES: "directory:employees",
};

export type DirectoryData = {
  organizations: DirectoryItem[];
  teams: DirectoryItem[];
  employees: DirectoryItem[];
};
