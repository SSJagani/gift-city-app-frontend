import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, getStoredAuth, setStoredAuth } from "../api/http.js";

const AuthContext = createContext(null);
let loadMePromise = null;

function getUserFromResponse(response) {
  return response?.user ?? response?.data?.user ?? response?.data ?? response ?? null;
}

function normalizeAuthPayload(payload) {
  if (!payload) return null;

  const data = payload.data ?? payload;
  const user = payload.user ?? data.user ?? null;
  const tokenSource = data.tokens ?? data;
  const { user: _user, ...tokens } = tokenSource;

  return { tokens, user };
}

function loadCurrentUser() {
  if (!loadMePromise) {
    loadMePromise = authApi.me()
      .then(getUserFromResponse)
      .finally(() => {
        loadMePromise = null;
      });
  }

  return loadMePromise;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [booting, setBooting] = useState(true);

  const persistAuth = useCallback(async (payload, options = {}) => {
    let nextAuth = normalizeAuthPayload(payload);

    if (nextAuth?.tokens?.access_token && !nextAuth.user) {
      nextAuth = { ...nextAuth, user: await loadCurrentUser() };
    }

    setStoredAuth(nextAuth, options);
    setAuth(nextAuth);
    return nextAuth;
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMe() {
      if (!getStoredAuth()?.tokens?.access_token) {
        setBooting(false);
        return;
      }

      try {
        const user = await loadCurrentUser();
        if (active) {
          const current = getStoredAuth();
          const nextAuth = { ...current, user };
          setStoredAuth(nextAuth);
          setAuth(nextAuth);
        }
      } catch {
        if (active) {
          setStoredAuth(null);
          setAuth(null);
        }
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }

    loadMe();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (credentials, options = {}) => {
      const payload = await authApi.login(credentials);
      return persistAuth(payload, options);
    },
    [persistAuth],
  );

  const register = useCallback(
    async (formValues) => {
      const payload = await authApi.register(formValues);
      return persistAuth(payload);
    },
    [persistAuth],
  );

  const logout = useCallback(async () => {
    const refreshToken = getStoredAuth()?.tokens?.refresh_token;
    setStoredAuth(null);
    setAuth(null);

    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Local logout should still succeed when the server session is gone.
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      auth,
      booting,
      isAuthenticated: Boolean(auth?.tokens?.access_token),
      user: auth?.user || null,
      login,
      register,
      logout,
    }),
    [auth, booting, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
