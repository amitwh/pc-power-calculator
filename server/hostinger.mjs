// The Hostinger deployment has no nginx in front of the build, so this process
// is the whole server: it serves the prerendered static output and answers the
// mail API on the same origin.
//
// It mirrors what nginx/default.conf does on the Coolify deployment, and what
// public/.htaccess does when LiteSpeed serves the files directly:
//
//   - a prerendered route is served from <route>/index.html, with no redirect
//     to a trailing slash, so the canonical URL in the page is the URL that
//     answers 200;
//   - anything that is not a file on disk (a share link like /build/<token>)
//     falls back to the SPA shell;
//   - /api/ is not part of that fallback — an API path that does not exist
//     must 404, not answer with the app shell.
//
// The security headers are the same policy nginx/default.conf sets, so the two
// deployments are not at different postures. Keep them in sync.

import http from 'node:http';
import { constants } from 'node:fs';
import { open, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHandler, describeTransport } from './mail.mjs';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

const CONTENT_SECURITY_POLICY =
  "default-src 'self'; " +
  "script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com; " +
  "style-src 'self' 'unsafe-inline'; " +
  "font-src 'self' data:; " +
  "connect-src 'self' data: https://www.googletagmanager.com https://ipapi.co https://ipwho.is https://ip-api.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://*.doubleclick.net; " +
  "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net; " +
  "manifest-src 'self'; " +
  "worker-src 'self' blob:; " +
  "frame-src 'self' https://*.googlesyndication.com https://googleads.g.doubleclick.net; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "frame-ancestors 'none'";

/** Every response carries these — the nginx deployment sets the same policy. */
const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
};

/**
 * Where the built site lives.
 *
 * Hostinger runs the entry file from a directory below the site root, and the
 * build output may be in `dist/` (the build directory) or already synced to
 * `public_html/` (the document root). Both are checked, walking up from the
 * working directory, and the first one holding an index.html wins.
 */
/**
 * Where the built site lives.
 *
 * The platform publishes each build into its own version directory and keeps
 * a pointer at the current one. The entry file runs from inside the version
 * it was started with, so the pointer — not the working directory — is what
 * has to be followed, or every deploy after this one would be invisible.
 *
 * The candidates are tried in order of how well they survive a deploy: a
 * `current` pointer first, then the document root, then the versioned build
 * directory as a last resort. The path is returned unresolved on purpose —
 * the symlink is resolved per request, so a new build is picked up.
 */
async function findStaticRootPath() {
  // An explicit STATIC_ROOT is authoritative: if it is wrong, the site fails
  // loudly rather than quietly serving some other directory.
  if (process.env.STATIC_ROOT) {
    const explicit = path.resolve(process.env.STATIC_ROOT);
    try {
      const info = await stat(path.join(explicit, 'index.html'));
      if (info.isFile()) return explicit;
    } catch {
      // Fall through — it will report that no root was found.
    }
    return null;
  }

  const ancestors = [];
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    ancestors.push(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  const hasIndex = async (candidate) => {
    try {
      const info = await stat(path.join(candidate, 'index.html'));
      return info.isFile();
    } catch {
      return false;
    }
  };

  // First: the platform's pointer to the current build. It is a symlink to
  // the version directory, so following it is what makes a deploy visible
  // without a restart. The path is kept *through* the pointer — resolving it
  // here would pin the server to the version that happens to be live now.
  for (const ancestor of ancestors) {
    const pointer = path.join(ancestor, 'current');
    try {
      const info = await stat(await realpath(pointer));
      if (!info.isDirectory()) continue;
    } catch {
      // No pointer at this level.
      continue;
    }

    for (const relative of ['public_html', path.join('nodejs', 'dist'), 'dist']) {
      const candidate = path.join(pointer, relative);
      if (await hasIndex(candidate)) return candidate;
    }
  }

  // Then: the document root, then the versioned build directory.
  for (const name of ['public_html', 'dist']) {
    for (const ancestor of ancestors) {
      const candidate = path.join(ancestor, name);
      if (await hasIndex(candidate)) return candidate;
    }
  }
  return null;
}

let staticRootPath = await findStaticRootPath();
const staticRoot = staticRootPath ? await realpath(staticRootPath).catch(() => null) : null;
console.log(
  `[hostinger] serving ${staticRoot ?? '(no static root found)'} on ${HOST}:${PORT}`,
);

// The directory layout around the entry file, once, at startup. The platform
// moves things between deployments, and a server that cannot find its files
// says so here rather than serving nothing.
try {
  const { readdir } = await import('node:fs/promises');
  const lines = [];
  let dir = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    const names = await readdir(dir).catch(() => []);
    lines.push(`${dir} -> ${names.join(', ')}`);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  console.log(`[hostinger] layout:\n  ${lines.join('\n  ')}`);
} catch {
  // The listing is a diagnostic; the server does not depend on it.
}

const mailHandler = createHandler();

// Say up front what the mail API will use, and whether the SMTP host even
// resolves from here — a shared host with restricted egress cannot send, and
// that should be visible in the log rather than discovered by a visitor.
const transport = await describeTransport();
console.log(
  `[hostinger] SMTP ${transport.host}:${transport.port} as ${transport.user} — DNS: ${transport.resolved}`,
);

/**
 * The canonical static root, refreshed as the platform moves it.
 *
 * Why it is not fixed at startup: the platform publishes each build into its
 * own version directory and points the document root at the current one. A
 * path captured at startup would keep serving the build that was live then,
 * and every deploy after it would be invisible.
 */
let resolvedRoot = null;
let resolvedAt = 0;

async function currentRoot() {
  const now = Date.now();
  if (resolvedRoot && now - resolvedAt < 2000) return resolvedRoot;
  try {
    resolvedRoot = await realpath(staticRootPath);
  } catch {
    // The build this pointed at is gone — look for the current one.
    staticRootPath = await findStaticRootPath();
    try {
      resolvedRoot = staticRootPath ? await realpath(staticRootPath) : null;
    } catch {
      resolvedRoot = null;
    }
  }
  resolvedAt = now;
  return resolvedRoot;
}

/** Is this path the root itself, or inside it? */
function isInside(root, target) {
  return target === root || target.startsWith(root + path.sep);
}

/**
 * A regular file inside the static root, or null.
 *
 * The path is checked twice on purpose. `path.resolve` collapses `..` before
 * it can climb out, and the containment test refuses anything outside the
 * root. Then the file's real path is compared against the canonical root, so
 * a symlink pointing out of the web root is refused too — and the file is
 * opened with O_NOFOLLOW, so it cannot be swapped for one between the check
 * and the read.
 */
async function fileAt(relativePath) {
  const root = await currentRoot();
  if (!root) return null;
  const candidate = path.resolve(root, `.${path.posix.normalize(relativePath)}`);
  if (!isInside(root, candidate)) return null;

  let real;
  try {
    real = await realpath(candidate);
  } catch {
    return null;
  }
  if (!isInside(root, real)) return null;

  try {
    const info = await stat(real);
    return info.isFile() ? real : null;
  } catch {
    return null;
  }
}

async function sendFile(res, filePath, { noCache = false } = {}) {
  let handle;
  try {
    // O_NOFOLLOW closes the window between the containment check and the read.
    handle = await open(filePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  } catch {
    sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found.', detail: {} });
    return;
  }

  const type = MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  const isHtml = type.startsWith('text/html');
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': type,
    // HTML is always revalidated — a deploy has to be visible on the next
    // visit, not up to an hour later. The hashed assets can sit in a cache.
    'Cache-Control': noCache || isHtml ? 'no-cache' : 'public, max-age=3600',
  });
  handle.createReadStream().pipe(res);
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url ?? '/', `http://${HOST}:${PORT}`).pathname;
  } catch {
    sendJson(res, 400, { error: 'BAD_REQUEST', message: 'Malformed URL.', detail: {} });
    return;
  }

  if (pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  // The mail API. It owns its own responses, headers and errors.
  if (pathname === '/api/v1/messages') {
    mailHandler(req, res);
    return;
  }

  void (async () => {
    // A real file wins: assets, robots.txt, sitemap.xml, the key file.
    const direct = await fileAt(pathname);
    if (direct) {
      await sendFile(res, direct, { noCache: pathname === '/sw.js' || pathname === '/manifest.webmanifest' });
      return;
    }

    // A prerendered route: <route>/index.html, with no trailing-slash redirect.
    const index = await fileAt(path.posix.join(pathname, 'index.html'));
    if (index) {
      await sendFile(res, index);
      return;
    }

    // Anything else is a client-side route: the SPA shell.
    const shell = await fileAt('/index.html');
    if (!shell) {
      sendJson(res, 500, {
        error: 'INTERNAL_ERROR',
        message: 'The site files could not be read.',
        detail: {},
      });
      return;
    }
    await sendFile(res, shell, { noCache: false });
  })();
});

server.listen(PORT, HOST, () => {
  console.log(`[hostinger] listening on ${HOST}:${PORT}`);
});
