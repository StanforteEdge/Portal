import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@stanforte/shared";
import { authApi, sessionStorage } from "@/lib/core";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  const refreshStatus = useCallback(async () => {
    const session = sessionStorage.getStoredSession();
    if (!session.accessToken || !session.refreshToken) {
      setUser(null);
      setStatus("unauthenticated");
      setInitialized(true);
      return;
    }

    setStatus("checking");

    try {
      const result = await authApi.fetchStatus();
      if (result.authenticated && result.user) {
        setUser(result.user);
        setStatus("authenticated");
      } else {
        const fallbackUser = await authApi.fetchCurrentUser();
        if (fallbackUser) {
          setUser(fallbackUser);
          setStatus("authenticated");
        } else {
          sessionStorage.clearSession();
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    } catch {
      const fallbackUser = await authApi.fetchCurrentUser();
      if (fallbackUser) {
        setUser(fallbackUser);
        setStatus("authenticated");
      } else {
        sessionStorage.clearSession();
        setUser(null);
        setStatus("unauthenticated");
      }
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { tokens, user: authUser } = await authApi.login(email, password);
    sessionStorage.persistSession(tokens.access_token, tokens.refresh_token, tokens.expires_in);
    setUser(authUser);
    setStatus("authenticated");
    setInitialized(true);
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    sessionStorage.clearSession();
    setUser(null);
    setStatus("unauthenticated");
    setInitialized(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      initialized,
      signIn,
      signOut,
      refreshStatus,
    }),
    [initialized, refreshStatus, signIn, signOut, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
