const LOCAL_API_BASE = "http://localhost:8000/api/v1";

/** Normalize Vercel env: accepts base host or full /api/v1 URL. */
const normalizeApiBaseUrl = (raw: string): string => {
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
};

/**
 * Backend API root.
 * - Local: http://localhost:8000/api/v1 (default)
 * - Vercel: set VITE_API_URL=https://api.coriolisxyz.xyz in project env vars
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
  : LOCAL_API_BASE;
