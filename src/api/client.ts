/**
 * Klien HTTP untuk AbsensiPro API (Laravel + MySQL).
 *
 * Catatan konfigurasi:
 * - Set EXPO_PUBLIC_API_URL di file `.env` (lihat `.env.example`).
 * - Emulator Android memakai 10.0.2.2 untuk mengakses localhost komputer.
 * - Perangkat fisik harus memakai IP LAN komputer, contoh http://192.168.1.10:8000/api/v1.
 */

export interface ApiErrorBody {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? 'Terjadi kesalahan pada server.');
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.errors = body.errors;
  }

  /** Pesan pertama dari validasi, untuk ditampilkan di form. */
  get firstValidationMessage(): string | undefined {
    if (!this.errors) return undefined;
    const first = Object.values(this.errors)[0];
    return first?.[0];
  }
}

const DEFAULT_BASE_URL = 'http://10.0.2.2:8000/api/v1';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? DEFAULT_BASE_URL;

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/** Dipanggil sekali oleh store untuk menangani 401 (token kedaluwarsa). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

type Query = Record<string, string | number | boolean | null | undefined>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;

  const params = Object.entries(query).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== null && entry[1] !== undefined,
  );

  if (params.length === 0) return path;

  const search = params
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return `${path}?${search}`;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
  query?: Query;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, form, query, signal } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${withQuery(path, query)}`, {
    method,
    headers,
    body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
    signal,
  });

  const payload = await parseBody(response);

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (payload ?? {}) as ApiErrorBody,
    );
  }

  return payload as T;
}
