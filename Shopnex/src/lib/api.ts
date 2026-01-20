import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from './env';
import { readTokens, writeTokens } from './authStorage';

const apiBaseURL = env.apiBaseUrl ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = readTokens();
  if (tokens?.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const res = await axios.post(
      `${apiBaseURL}/auth/refresh`,
      { refreshToken: tokens.refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const nextAccess = res.data?.accessToken as string | undefined;
    const nextRefresh = res.data?.refreshToken as string | undefined;
    if (!nextAccess || !nextRefresh) return null;

    writeTokens({ accessToken: nextAccess, refreshToken: nextRefresh });
    return nextAccess;
  } catch {
    writeTokens(null);
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (!newAccessToken) throw error;

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api.request(originalRequest);
  },
);


