// Same-origin mail endpoint for suggestions and feedback.
//
// Listens on 127.0.0.1:3001 and is reached only through nginx's
// /api/v1/messages proxy. Plain ESM + node:http — no framework, no Express.

import http from 'node:http';
import dns from 'node:dns/promises';
import { pathToFileURL } from 'node:url';
import nodemailer from 'nodemailer';
import { validateMessage } from './validate.mjs';
import { renderMessage } from './template.mjs';

const HOST = '127.0.0.1';
// Fixed to match nginx's proxy target; a platform-injected PORT must not move it.
const PORT = 3001;
const ENDPOINT = '/api/v1/messages';
const MAX_BODY_BYTES = 32 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

let transporter;

/** Lazily built nodemailer transport; null means SMTP credentials are absent. */
function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!user || !password) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.hostinger.com',
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass: password },
  });
  return transporter;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = (header ?? '').split(',')[0].trim();
  return first || req.socket.remoteAddress || 'unknown';
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve({ tooLarge, body: Buffer.concat(chunks).toString('utf8') }));
    req.on('error', () => resolve({ tooLarge: false, body: '' }));
  });
}

async function handleMessage(req, res, rateLimit) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) {
    sendJson(res, 422, {
      error: 'VALIDATION_ERROR',
      message: 'Content-Type must be application/json.',
      detail: { field: 'content-type', reason: 'required' },
    });
    return;
  }

  const declaredLength = Number(req.headers['content-length'] ?? NaN);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    sendJson(res, 413, {
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Request body must be 32 KB or smaller.',
      detail: {},
    });
    req.resume();
    return;
  }

  const ip = clientIp(req);
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(limit.retryAfterMs / 1000)));
    sendJson(res, 429, {
      error: 'RATE_LIMITED',
      message: 'Too many submissions. Please wait a few minutes and try again.',
      detail: {},
    });
    return;
  }

  const { tooLarge, body } = await readBody(req);
  if (tooLarge) {
    sendJson(res, 413, {
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Request body must be 32 KB or smaller.',
      detail: {},
    });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    sendJson(res, 422, {
      error: 'VALIDATION_ERROR',
      message: 'Request body must be valid JSON.',
      detail: { field: 'body', reason: 'json' },
    });
    return;
  }

  const result = validateMessage(parsed);
  if (!result.ok) {
    sendJson(res, 422, {
      error: 'VALIDATION_ERROR',
      message: result.message,
      detail: result.detail,
    });
    return;
  }

  // Honeypot: accept silently and send nothing.
  if (result.honeypot) {
    sendJson(res, 200, { ok: true });
    return;
  }

  const transport = getTransporter();
  if (!transport) {
    sendJson(res, 500, {
      error: 'INTERNAL_ERROR',
      message: 'Email is not configured. Set SMTP_USER and SMTP_PASSWORD.',
      detail: {},
    });
    return;
  }

  const mail = renderMessage(result.value);
  const mailTo = process.env.MAIL_TO ?? 'support@concreteinfo.in';
  const mailFrom = process.env.MAIL_FROM ?? 'noreply@concreteinfo.co.in';

  try {
    await transport.sendMail({
      from: `"PC Power Calculator" <${mailFrom}>`,
      to: mailTo,
      replyTo: result.value.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: mail.logo
        ? [
            {
              filename: mail.logo.filename,
              content: mail.logo.content,
              contentType: 'image/png',
              cid: 'logo',
              contentDisposition: 'inline',
            },
          ]
        : [],
    });
    console.log(`[mail] sent ${result.value.kind}`);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.log(`[mail] failed: ${error instanceof Error ? error.message : String(error)}`);
    sendJson(res, 500, {
      error: 'INTERNAL_ERROR',
      message: 'Your message could not be sent. Please try again later.',
      detail: {},
    });
  }
}

/**
 * What the transporter will use, and whether this runtime can even resolve
 * the SMTP host.
 *
 * Why it exists: shared hosting has restricted egress, and a mail API whose
 * host does not resolve fails at the moment someone tries to send — which is
 * the worst time to find out. One line at startup says which host is
 * configured and whether it resolves.
 */
export async function describeTransport() {
  const host = process.env.SMTP_HOST ?? 'smtp.hostinger.com';
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER ?? '(unset)';
  let resolved;
  try {
    const addresses = await dns.lookup(host, { all: true });
    resolved = addresses.map((address) => address.address).join(', ') || 'no addresses';
  } catch (error) {
    resolved = `FAILED (${error instanceof Error ? error.message : String(error)})`;
  }
  return { host, port, user, resolved };
}

/**
 * Build the request handler. The rate-limit Map is per handler instance and
 * pruned on every request, so entries cannot outlive their window.
 *
 * Exported separately from `createServer` so a host that serves the site
 * itself — the Hostinger deployment, which has no nginx in front of it —
 * can mount the same handler instead of proxying to a second process.
 */
export function createHandler() {
  const hits = new Map();

  function rateLimit(ip, now = Date.now()) {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }

    const entry = hits.get(ip);
    if (!entry) {
      hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return { allowed: true };
    }
    if (entry.count >= RATE_MAX) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }
    entry.count += 1;
    return { allowed: true };
  }

  return (req, res) => {
    let pathname;
    try {
      pathname = new URL(req.url ?? '/', `http://${HOST}:${PORT}`).pathname;
    } catch {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found.', detail: {} });
      return;
    }

    if (pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (pathname !== ENDPOINT) {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found.', detail: {} });
      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendJson(res, 405, {
        error: 'METHOD_NOT_ALLOWED',
        message: 'Use POST for this endpoint.',
        detail: {},
      });
      return;
    }

    handleMessage(req, res, rateLimit).catch((error) => {
      console.log(`[mail] failed: ${error instanceof Error ? error.message : String(error)}`);
      if (!res.headersSent) {
        sendJson(res, 500, {
          error: 'INTERNAL_ERROR',
          message: 'Your message could not be sent. Please try again later.',
          detail: {},
        });
      }
    });
  };
}

/**
 * The standalone server: binds 127.0.0.1:3001 and is reached only through
 * nginx's /api/v1/messages proxy on the Coolify deployment.
 */
export function createServer() {
  return http.createServer(createHandler());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServer();
  server.listen(PORT, HOST);
}
