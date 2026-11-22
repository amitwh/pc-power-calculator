// @vitest-environment node
// The default jsdom environment cannot open a socket to a local port, and
// this test has to talk to a real server process.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';

const PORT = 3987;

interface Reply {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

/**
 * A plain HTTP request to the server under test.
 *
 * `fetch` is not used: in this test environment it is answered by an
 * interceptor that returns 503 for a local address, so the server is never
 * actually reached.
 */
function request(pathname: string): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: PORT, path: pathname, method: 'GET' },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

let server: ChildProcess;
let root: string;

/**
 * Boot server/hostinger.mjs against a temporary web root.
 *
 * The root holds a symlink pointing out of it, which is the case the file
 * server has to refuse: a link inside the web root must not become a way to
 * read /etc/passwd.
 */
beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'hostinger-test-'));
  await writeFile(path.join(root, 'index.html'), '<!doctype html><title>root</title>');
  await mkdir(path.join(root, 'guides'));
  await writeFile(path.join(root, 'guides', 'index.html'), '<!doctype html><title>guides</title>');
  await symlink('/etc/passwd', path.join(root, 'escape.txt'));

  server = spawn(process.execPath, ['server/hostinger.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT), STATIC_ROOT: root },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Surface a startup failure instead of timing out on it.
  server.stdout?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[hostinger] ${chunk.toString()}`);
  });
  server.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[hostinger] ${chunk.toString()}`);
  });

  // Wait for the port to answer.
  let lastError = 'no attempt made';
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const res = await request('/health');
      if (res.status === 200) return;
      lastError = `status ${res.status}`;
    } catch (error) {
      lastError = error instanceof Error ? `${error.message} / ${String(error.cause)}` : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`the server did not start — ${lastError}`);
}, 20_000);

afterAll(async () => {
  server?.kill('SIGTERM');
  if (root) await rm(root, { recursive: true, force: true });
});

describe('the Hostinger file server', () => {
  test('serves the root page', async () => {
    const res = await request('/');
    expect(res.status).toBe(200);
    expect(res.body).toContain('<title>root</title>');
  });

  test('serves a prerendered route without a trailing-slash redirect', async () => {
    const res = await request('/guides');
    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
    expect(res.body).toContain('<title>guides</title>');
  });

  test('falls back to the SPA shell for a client-side route', async () => {
    const res = await request('/build/some-token');
    expect(res.status).toBe(200);
    expect(res.body).toContain('<title>root</title>');
  });

  test('does not serve a symlink that points out of the web root', async () => {
    const res = await request('/escape.txt');
    expect(res.body).not.toContain('root:x:');
    expect(res.body).not.toContain('/bin/bash');
  });

  test('does not serve a file outside the web root by path traversal', async () => {
    const res = await request('/../../etc/passwd');
    expect(res.body).not.toContain('root:x:');
  });

  test('does not serve a percent-encoded traversal', async () => {
    const res = await request('/%2e%2e%2f%2e%2e%2fetc%2fpasswd');
    expect(res.body).not.toContain('root:x:');
  });

  test('sets the security headers on every response', async () => {
    const res = await request('/');
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toContain('max-age=');
  });

  test('404s an API path that does not exist instead of serving the shell', async () => {
    const res = await request('/api/v1/nothing-here');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/json');
    // Not the app shell: a client asking for JSON must not be handed HTML.
    expect(res.body).not.toContain('<title>root</title>');
    expect(JSON.parse(res.body).error).toBe('NOT_FOUND');
  });

  test('404s a missing asset instead of serving the shell', async () => {
    const res = await request('/assets/index-missing.js');
    expect(res.status).toBe(404);
    // A chunk that answers with HTML and a 200 fails silently in the browser.
    expect(res.body).not.toContain('<title>root</title>');
  });

  test('still serves the shell for a client-side route', async () => {
    const res = await request('/build/some-token');
    expect(res.status).toBe(200);
    expect(res.body).toContain('<title>root</title>');
  });
});
