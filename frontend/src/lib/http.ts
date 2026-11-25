import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthSession } from "./types";

/**
 * The access token lives ONLY in memory (never localStorage, so XSS cannot steal it).
 * The refresh token is an httpOnly cookie set by the authentication service.
 */
let accessToken: string | null = null;
let authFailureHandler: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const onAuthFailure = (fn: (() => void) | null) => {
  authFailureHandler = fn;
};

export const http = axios.create({ baseURL: "/api", withCredentials: true });

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

// one refresh at a time (the refresh token is rotated, so parallel refreshes would invalidate each other)
let refreshPromise: Promise<AuthSession | null> | null = null;

export function refreshSession(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ data: AuthSession }>("/api/auth/refresh", null, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.data.accessToken);
        return res.data.data;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const NO_RETRY = /^\/auth\/(login|register|refresh|logout)/;

// on 401: refresh the access token once and replay the request
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retried && !NO_RETRY.test(original.url ?? "")) {
      original._retried = true;
      const session = await refreshSession();
      if (session) {
        original.headers.set("Authorization", `Bearer ${session.accessToken}`);
        return http(original);
      }
      authFailureHandler?.();
    }
    return Promise.reject(error);
  },
);
