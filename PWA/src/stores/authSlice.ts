import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  login as loginRequest,
  logout as logoutRequest,
  fetchStatus,
  requestPasswordReset,
  resetPassword,
} from "@/services/auth";
import {
  clearSession,
} from "@/utils/authStorage";
import type { RootState } from "./store";

export interface AuthUser {
  id: number;
  roles: string[];
  permissions?: string[];
  enabled_modules?: string[];
  [key: string]: unknown;
}

interface AuthState {
  status: "idle" | "checking" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  enabledModules: string[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  status: "idle",
  user: null,
  roles: [],
  permissions: [],
  enabledModules: [],
  loading: false,
  error: null,
  initialized: false,
};

interface LoginPayload {
  email: string;
  password: string;
}

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const status = await fetchStatus();

      if (status?.authenticated && status.user) {
        return { authenticated: true, user: status.user };
      }

      clearSession();
      return { authenticated: false };
    } catch (error) {
      clearSession();
      return rejectWithValue("Unable to verify session");
    }
  }
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }: LoginPayload, { rejectWithValue }) => {
    try {
      const { user } = await loginRequest(email, password);
      return { user };
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Login failed. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await logoutRequest();
  clearSession();
  return true;
});

export const requestPasswordResetThunk = createAsyncThunk(
  "auth/requestPasswordReset",
  async (email: string, { rejectWithValue }) => {
    try {
      await requestPasswordReset(email);
      return true;
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Unable to process password reset request.";
      return rejectWithValue(message);
    }
  }
);

export const resetPasswordThunk = createAsyncThunk(
  "auth/resetPassword",
  async (
    payload: { token: string; new_password: string },
    { rejectWithValue }
  ) => {
    try {
      await resetPassword(payload);
      return true;
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Unable to reset password.";
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.roles = action.payload?.roles ?? [];
      state.permissions = (action.payload?.permissions as string[]) ?? [];
      state.enabledModules = (action.payload?.enabled_modules as string[]) ?? [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = "checking";
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        if (action.payload.authenticated && action.payload.user) {
      state.status = "authenticated";
      state.user = action.payload.user;
      state.roles = action.payload.user.roles ?? [];
      state.permissions =
        (action.payload.user.permissions as string[]) ?? [];
      state.enabledModules =
        (action.payload.user.enabled_modules as string[]) ?? [];
        } else {
          state.status = "unauthenticated";
          state.user = null;
          state.roles = [];
          state.permissions = [];
          state.enabledModules = [];
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.status = "unauthenticated";
        state.user = null;
        state.roles = [];
        state.permissions = [];
        state.enabledModules = [];
        state.error = action.payload as string | null;
      })
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.status = "authenticated";
        state.user = action.payload.user;
        state.roles = action.payload.user.roles ?? [];
        state.permissions =
          (action.payload.user.permissions as string[]) ?? [];
        state.enabledModules =
          (action.payload.user.enabled_modules as string[]) ?? [];
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.status = "unauthenticated";
        state.error = action.payload as string | null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.status = "unauthenticated";
        state.user = null;
        state.roles = [];
        state.permissions = [];
        state.enabledModules = [];
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string | null;
      })
      .addCase(requestPasswordResetThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestPasswordResetThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestPasswordResetThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string | null;
      })
      .addCase(resetPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string | null;
      });
  },
});

export const { setAuthUser } = authSlice.actions;

export const selectAuthState = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.status === "authenticated";

export default authSlice.reducer;
