import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, getStoredAuth, setStoredAuth } from "../api/http.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [booting, setBooting] = useState(true);

  const persistAuth = useCallback((payload, options = {}) => {
    const nextAuth = payload ? { tokens: payload.data, user: payload.user } : null;
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
        const user = await authApi.me();
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
