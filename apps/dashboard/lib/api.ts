import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL = typeof window === "undefined" ? "" : "";

export type RateLimitError = {
  code: "RATE_LIMIT";
  retryAfterSec?: number;
  message: string;
};

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (status === 429) {
      const retryAfter = error.response?.headers?.["retry-after"];
      const sec = retryAfter ? parseInt(String(retryAfter), 10) : undefined;
      const rl: RateLimitError = {
        code: "RATE_LIMIT",
        retryAfterSec: Number.isFinite(sec) ? sec : undefined,
        message: "Too many requests. Please wait before retrying.",
      };
      return Promise.reject(rl);
    }

    if (status === 401 && config && !config._retry) {
      config._retry = true;
      try {
        await api.post("/api/auth/refresh", {});
        return api(config);
      } catch {
        /* fall through */
      }
    }

    return Promise.reject(error);
  },
);

export function isRateLimitError(e: unknown): e is RateLimitError {
  return typeof e === "object" && e !== null && (e as RateLimitError).code === "RATE_LIMIT";
}
