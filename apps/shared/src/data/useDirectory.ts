// apps/shared/src/data/useDirectory.ts
import { useCachedQuery } from "./useCachedQuery";
import { DirectoryKeys, type DirectoryItem } from "./directory";

/**
 * Hook to provide cached access to organization, team, and employee directories.
 * This is a shared hook that can be used by any React application (PWA, Mobile).
 * 
 * It requires the API instances to be passed in.
 */
export function useDirectory(
  cache: any,
  apis: {
    resource: { listOrganizations: () => Promise<any[]>; listGroups: () => Promise<any[]> };
    hr: { listEmployees: (params?: any) => Promise<{ data: any[] }> };
  }
) {
  const { data: orgs, loading: orgsLoading, refetch: refetchOrgs } = useCachedQuery(
    cache,
    DirectoryKeys.ORGANIZATIONS,
    () => apis.resource.listOrganizations(),
    { ttlMs: 1000 * 60 * 5 } // 5 mins cache
  );

  const { data: groups, loading: groupsLoading, refetch: refetchGroups } = useCachedQuery(
    cache,
    DirectoryKeys.TEAMS,
    () => apis.resource.listGroups(),
    { ttlMs: 1000 * 60 * 5 }
  );

  const { data: employees, loading: empLoading, refetch: refetchEmployees } = useCachedQuery(
    cache,
    DirectoryKeys.EMPLOYEES,
    () => apis.hr.listEmployees({ status: "active" }),
    { ttlMs: 1000 * 60 * 5 }
  );

  const organizationOptions: DirectoryItem[] = (orgs || []).map(o => ({
    id: o.id,
    name: o.name,
    subtitle: o.code
  }));

  const teamOptions: DirectoryItem[] = (groups || []).map(t => ({
    id: t.id,
    name: t.name,
    subtitle: t.type
  }));

  const employeeOptions: DirectoryItem[] = (employees?.data || []).map((e: any) => ({
    id: e.user_id || e.id,
    name: `${e.first_name} ${e.last_name}`,
    subtitle: e.job_title || e.email
  }));

  const refreshAction = async () => {
    await Promise.all([refetchOrgs(), refetchGroups(), refetchEmployees()]);
  };

  return {
    organizations: organizationOptions,
    teams: teamOptions,
    employees: employeeOptions,
    loading: orgsLoading || groupsLoading || empLoading,
    refresh: refreshAction,
    getName: (id: string, type: 'org' | 'team' | 'employee') => {
      const list = type === 'org' ? organizationOptions : type === 'team' ? teamOptions : employeeOptions;
      return list.find(l => l.id === id)?.name || id;
    }
  };
}
