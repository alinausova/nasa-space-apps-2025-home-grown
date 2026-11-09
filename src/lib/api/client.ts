export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly detail: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function detailOf(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('detail' in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === 'string') return detail;
  // FastAPI validation errors: [{ msg, loc, ... }]
  if (Array.isArray(detail)) {
    const messages = detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : null))
      .filter(Boolean);
    return messages.length ? messages.join('; ') : null;
  }
  return null;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  let response: Response;
  try {
    response = await fetchImpl(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError('We could not reach the Home Grown server.', null, null);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = detailOf(body);
    throw new ApiError(detail ?? `The server answered with ${response.status}.`, response.status, detail);
  }

  return (await response.json()) as T;
}
