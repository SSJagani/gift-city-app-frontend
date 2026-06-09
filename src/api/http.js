const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const STORAGE_KEY = "gift_city_auth";

let authCache = readStoredAuth();
let refreshPromise = null;

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(nextAuth, remember = true) {
  authCache = nextAuth;
  if (nextAuth) {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    otherStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message =
      body?.detail?.message ||
      body?.detail ||
      body?.message ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

async function rawRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  return parseResponse(response);
}

async function refreshTokens() {
  if (!authCache?.tokens?.refresh_token) {
    throw new Error("No refresh token is available.");
  }

  if (!refreshPromise) {
    refreshPromise = rawRequest("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: authCache.tokens.refresh_token }),
    })
      .then((payload) => {
        const nextAuth = { tokens: payload.data, user: payload.user };
        writeStoredAuth(nextAuth);
        return nextAuth;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function getStoredAuth() {
  return authCache;
}

export function setStoredAuth(nextAuth, options = {}) {
  writeStoredAuth(nextAuth, options.remember ?? true);
}

export async function apiRequest(path, options = {}) {
  const token = authCache?.tokens?.access_token;
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    return await rawRequest(path, { ...options, headers });
  } catch (error) {
    if (error.status !== 401 || options.skipRefresh) {
      throw error;
    }

    const nextAuth = await refreshTokens();
    return rawRequest(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${nextAuth.tokens.access_token}`,
      },
    });
  }
}

export const authApi = {
  async login(credentials) {
    return rawRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  async register(payload) {
    return rawRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async forgotPassword(email) {
    return rawRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(token, newPassword) {
    return rawRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },
  async verifyEmail(token) {
    return rawRequest("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
  async resendVerification() {
    return apiRequest("/auth/resend-verification", {
      method: "POST",
    });
  },
  async logout(refreshToken) {
    return apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
      skipRefresh: true,
    });
  },
  async me() {
    return apiRequest("/users/me");
  },
};

export const stocksApi = {
  async topStocks({ rangeType, rangeCount, stockCount }) {
    const params = new URLSearchParams({
      range_type: rangeType,
      range_count: String(rangeCount),
      stock_count: String(stockCount),
    });
    return apiRequest(`/stocks/top?${params.toString()}`);
  },
};
