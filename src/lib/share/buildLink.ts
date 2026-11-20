import { useBuildStore } from '@/store/buildStore';

/**
 * Shareable-build permalink helpers.
 *
 * Wire format is the one the HTML export already embeds and `/compare` already
 * imports: `?builds=<base64 json>`. One format, one sanitization path
 * (`importBuild`), one set of tests.
 */

/** Encoded-URL cap from the distribution spec (6 KB); beyond it, fall back to export. */
export const MAX_SHARE_URL_LENGTH = 6000;

/** UTF-8-safe base64, then percent-encoded for the query string. */
export function encodeBuildsParam(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return encodeURIComponent(btoa(bin));
}

/** Inverse of `encodeBuildsParam`. Returns null on any bad input — never throws. */
export function decodeBuildsParam(value: string): string | null {
  try {
    const bin = atob(decodeURIComponent(value));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    // Reject anything that isn't JSON up front, so callers never receive a
    // payload that will explode later in the import path.
    JSON.parse(json);
    return json;
  } catch {
    return null;
  }
}

/** Full share URL for a build payload, or null when the encoded URL exceeds the cap. */
export function buildShareUrl(
  json: string,
  location: { origin: string; pathname: string } = window.location,
): string | null {
  try {
    const url = `${location.origin}${location.pathname}?builds=${encodeBuildsParam(json)}`;
    return url.length > MAX_SHARE_URL_LENGTH ? null : url;
  } catch {
    return null;
  }
}

/**
 * Session guard: a single page load imports at most one shared build, so the
 * query can never be applied twice (e.g. double-mounted effects in dev).
 */
let importHandled = false;

/**
 * Parse `?builds=` out of `search`, import the build through the store's
 * sanitizing `importBuild`, and return the new build's id. The imported build
 * becomes the active build. Wipes the query so a reload can't duplicate the
 * import. A missing or malformed token is a silent no-op.
 *
 * The store is imported at module scope but only dereferenced inside the
 * function body, so a future store↔lib cycle still resolves at call time.
 */
export function importBuildFromSearch(search: string, pathname: string): string | null {
  if (importHandled) return null;
  const match = search.match(/[?&]builds=([^&]+)/);
  if (!match) return null;
  importHandled = true;

  const json = decodeBuildsParam(match[1]);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as { build?: unknown };
    if (!parsed?.build) return null;
    const before = new Set(useBuildStore.getState().builds.map((b) => b.id));
    useBuildStore.getState().importBuild(json);
    const added = useBuildStore.getState().builds.find((b) => !before.has(b.id));
    window.history.replaceState(null, '', pathname);
    return added?.id ?? null;
  } catch {
    return null;
  }
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Share the build link: `navigator.share` where available, clipboard copy
 * otherwise. Never throws.
 *
 * A dismissed share sheet (`AbortError`) reports 'cancelled' and must NOT fall
 * through to the clipboard — silently copying after the user backed out would
 * confirm an action they declined.
 */
export async function shareBuild(json: string): Promise<ShareResult> {
  const url = buildShareUrl(json);
  if (!url) return 'failed';

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ url });
      return 'shared';
    } catch (err) {
      if ((err as { name?: string } | null)?.name === 'AbortError') return 'cancelled';
      // Share unavailable — fall back to the clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
