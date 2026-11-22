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
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { createHandler } from './mail.mjs';

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
async function findStaticRoot() {
  const candidates = [];
  if (process.env.STATIC_ROOT) candidates.push(path.resolve(process.env.STATIC_ROOT));

  let dir = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    candidates.push(path.join(dir, 'public_html'), path.join(dir, 'dist'));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  for (const candidate of candidates) {
    try {
      const info = await stat(path.join(candidate, 'index.html'));
      if (info.isFile()) return candidate;
    } catch {
      // Not here — try the next candidate.
    }
  }
  return null;
}

const staticRoot = await findStaticRoot();
console.log(
  `[hostinger] serving ${staticRoot ?? '(no static root found)'} on ${HOST}:${PORT}`,
);

const mailHandler = createHandler();

/** A file on disk under the static root, or null. */
async function fileAt(relativePath) {
  if (!staticRoot) return null;
  const resolved = path.resolve(staticRoot, `.${path.posix.normalize(relativePath)}`);
  // Never serve anything outside the static root.
  if (resolved !== staticRoot && !resolved.startsWith(staticRoot + path.sep)) return null;
  try {
    const info = await stat(resolved);
    return info.isFile() ? resolved : null;
  } catch {
    return null;
  }
}

function sendFile(res, filePath, { noCache = false } = {}) {
  const type = MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': type,
    'Cache-Control': noCache ? 'no-cache' : 'public, max-age=3600',
  });
  createReadStream(filePath).pipe(res);
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
      sendFile(res, direct, { noCache: pathname === '/sw.js' || pathname === '/manifest.webmanifest' });
      return;
    }

    // A prerendered route: <route>/index.html, with no trailing-slash redirect.
    const index = await fileAt(path.posix.join(pathname, 'index.html'));
    if (index) {
      sendFile(res, index);
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
    sendFile(res, shell, { noCache: false });
  })();
});

server.listen(PORT, HOST, () => {
  console.log(`[hostinger] listening on ${HOST}:${PORT}`);
});
