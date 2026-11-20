/// <reference types="vitest/globals" />
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  MAX_SHARE_URL_LENGTH,
  buildShareUrl,
  decodeBuildsParam,
  encodeBuildsParam,
  shareBuild,
} from '@/lib/share/buildLink';

// Non-ASCII in a branded name: an accented character plus characters outside
// Latin-1, which plain btoa() cannot encode.
const BUILD_JSON = JSON.stringify({
  version: 1,
  build: {
    id: 'src-build',
    name: 'Café rig — ₹ budget · 東京',
    category: 'gaming',
    components: { cpu: 'cpu-amd-ryzen-7-7800x3d', gpu: 'gpu-nvidia-rtx-4070' },
    tdpOverrides: {},
    quantities: { 'cpu-amd-ryzen-7-7800x3d': 2 },
    schedule: [{ workload_id: 'office', hours_per_day: 8 }],
    location: { country_iso2: 'IN', subdivision_code: 'MH' },
  },
});

describe('encodeBuildsParam / decodeBuildsParam', () => {
  test('round-trips a build JSON containing non-ASCII', () => {
    const param = encodeBuildsParam(BUILD_JSON);
    expect(decodeBuildsParam(param)).toBe(BUILD_JSON);
  });

  test('decodes a plain-ASCII payload produced the legacy way (btoa + encodeURIComponent)', () => {
    const ascii = JSON.stringify({ version: 1, build: { id: 'a', name: 'Plain rig' } });
    const legacy = encodeURIComponent(btoa(ascii));
    expect(decodeBuildsParam(legacy)).toBe(ascii);
  });

  test('returns null for garbage, malformed base64 and invalid JSON', () => {
    expect(decodeBuildsParam('!!!not-base64!!!')).toBeNull();
    expect(decodeBuildsParam('%%%%')).toBeNull();
    expect(decodeBuildsParam(encodeURIComponent(btoa('definitely not json')))).toBeNull();
    expect(decodeBuildsParam('')).toBeNull();
  });
});

describe('buildShareUrl', () => {
  const location = { origin: 'https://pc-power.test', pathname: '/' };

  test('builds origin + pathname + ?builds= when the payload fits', () => {
    const url = buildShareUrl(BUILD_JSON, location);
    expect(url).toBe(`https://pc-power.test/?builds=${encodeBuildsParam(BUILD_JSON)}`);
    expect(url!.length).toBeLessThanOrEqual(MAX_SHARE_URL_LENGTH);
  });

  test('returns null once the encoded URL exceeds the cap', () => {
    const oversized = JSON.stringify({ version: 1, build: { name: 'x'.repeat(MAX_SHARE_URL_LENGTH) } });
    expect(buildShareUrl(oversized, location)).toBeNull();
  });
});

describe('shareBuild', () => {
  test("returns 'failed' for an over-cap payload without touching share/clipboard", async () => {
    const oversized = JSON.stringify({ version: 1, build: { name: 'x'.repeat(MAX_SHARE_URL_LENGTH) } });
    await expect(shareBuild(oversized)).resolves.toBe('failed');
  });
});

describe('shareBuild — platform paths', () => {
  const SMALL = JSON.stringify({ version: 1, build: { id: 'a', name: 'Small rig' } });

  afterEach(() => {
    // Leave navigator exactly as jsdom shipped it.
    delete (navigator as { share?: unknown }).share;
    delete (navigator as { clipboard?: unknown }).clipboard;
  });

  test("returns 'shared' when the native share sheet resolves", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    await expect(shareBuild(SMALL)).resolves.toBe('shared');
    expect(share).toHaveBeenCalledTimes(1);
  });

  test("a dismissed share sheet reports 'cancelled' and never copies to the clipboard", async () => {
    const abort = Object.assign(new Error('dismissed'), { name: 'AbortError' });
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(abort),
      configurable: true,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await expect(shareBuild(SMALL)).resolves.toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });

  test("falls back to the clipboard when the share API is unavailable", async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await expect(shareBuild(SMALL)).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(String(writeText.mock.calls[0][0])).toContain('?builds=');
  });

  test("returns 'failed' when the clipboard rejects", async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    await expect(shareBuild(SMALL)).resolves.toBe('failed');
  });
});
