export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
};

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  roles?: string[];
  permissions?: string[];
  onboarding_status?: string | null;
  organization_id?: string | null;
  primary_organization_id?: string | null;
  organization_ids?: string[];
  organizations?: Array<{
    id: string;
    name: string;
  }>;
};

export type AuthStatusResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

export type AuthSession = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
};
