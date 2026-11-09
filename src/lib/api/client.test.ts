import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './client';
import { toApiCoordinates, type LngLat } from './recommendations';

function failure(promise: Promise<unknown>): Promise<ApiError> {
  return promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: ApiError) => error,
  );
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('apiFetch', () => {
  it('returns parsed JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    await expect(apiFetch('/x', {}, fetchImpl)).resolves.toEqual({ ok: true });
  });

  it('surfaces FastAPI string detail', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(400, { detail: 'Selection area is too large.' }));
    const error = await failure(apiFetch('/x', {}, fetchImpl));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Selection area is too large.');
  });

  it('surfaces FastAPI validation errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(422, { detail: [{ msg: 'List should have at least 3 items', loc: ['body'] }] }),
    );
    const error = await failure(apiFetch('/x', {}, fetchImpl));

    expect(error.message).toBe('List should have at least 3 items');
  });

  it('falls back to the status when the body is not JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('oops', { status: 502 }));
    const error = await failure(apiFetch('/x', {}, fetchImpl));

    expect(error.message).toBe('The server answered with 502.');
    expect(error.detail).toBeNull();
  });

  it('reports network failures plainly', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await failure(apiFetch('/x', {}, fetchImpl));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBeNull();
  });

  it('rethrows aborts untouched', async () => {
    const abort = new DOMException('aborted', 'AbortError');
    const fetchImpl = vi.fn().mockRejectedValue(abort);

    await expect(apiFetch('/x', {}, fetchImpl)).rejects.toBe(abort);
  });
});

describe('toApiCoordinates', () => {
  const closed: LngLat[] = [
    [11.56, 48.14],
    [11.57, 48.14],
    [11.57, 48.15],
    [11.56, 48.14],
  ];

  it('drops the closing point and swaps to lat, lon', () => {
    expect(toApiCoordinates(closed)).toEqual([
      [48.14, 11.56],
      [48.14, 11.57],
      [48.15, 11.57],
    ]);
  });

  it('keeps open rings as they are', () => {
    expect(toApiCoordinates(closed.slice(0, 3))).toHaveLength(3);
  });
});
