import { describe, expect, test, vi, beforeEach } from 'vitest';
import { submitMessage, type FeedbackPayload } from '@/lib/forms/message';

const PAYLOAD: FeedbackPayload = {
  kind: 'feedback',
  type: 'general',
  subject: 'A subject',
  message: 'A message',
};

/** A JSON response carrying the API's success envelope. */
function okResponse() {
  return {
    status: 200,
    json: async () => ({ ok: true }),
  };
}

/**
 * The Hostinger deployment has no mail API, and its SPA fallback answers an
 * unknown POST with the app shell: HTTP 200, an HTML body. That is the case
 * this file exists for — a visitor must never be told their message was sent
 * when the request went nowhere.
 */
function appShellResponse() {
  return {
    status: 200,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON at position 0');
    },
  };
}

describe('submitMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('resolves when the API answers with its success envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse()));
    await expect(submitMessage(PAYLOAD)).resolves.toBeUndefined();
  });

  test('posts JSON to the messages endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse()));
    await submitMessage(PAYLOAD);
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/messages');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toMatchObject({ kind: 'feedback' });
  });

  test('rejects a 200 whose body is the app shell, not the envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(appShellResponse()));
    await expect(submitMessage(PAYLOAD)).rejects.toThrow(
      'The message could not be sent. Please try again.',
    );
  });

  test('rejects a 200 whose JSON does not carry ok: true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ message: 'not the envelope' }),
    }));
    await expect(submitMessage(PAYLOAD)).rejects.toThrow(
      'The message could not be sent. Please try again.',
    );
  });

  test('surfaces the API message on a rejection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 429,
      json: async () => ({ error: 'RATE_LIMITED', message: 'Too many messages.', detail: {} }),
    }));
    await expect(submitMessage(PAYLOAD)).rejects.toThrow('Too many messages.');
  });

  test('reports a connection failure in the visitor’s language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    await expect(submitMessage(PAYLOAD)).rejects.toThrow(
      'Could not reach the server. Check your connection and try again.',
    );
  });
});
