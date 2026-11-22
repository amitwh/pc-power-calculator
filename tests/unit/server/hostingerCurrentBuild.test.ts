// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';

const PORT = 3986;

function request(pathname: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: PORT, path: pathname, method: 'GET' },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/**
 * The platform publishes each build into its own version directory and keeps
 * a pointer at the current one. The server has to follow that pointer, or a
 * deploy would publish a new build that nobody ever sees.
 *
 * The layout below mirrors the one the platform uses:
 *
 *   hbuilds/
 *     current -> versions/<id>       the pointer
 *     versions/<id>/nodejs/dist/     the build
 */
describe('the Hostinger server follows the current build', () => {
  let server: ChildProcess;
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'hostinger-current-'));
    const builds = path.join(root, 'hbuilds');
    const versions = path.join(builds, 'versions');
    await mkdir(versions, { recursive: true });

    for (const id of ['v1', 'v2']) {
      const dist = path.join(versions, id, 'nodejs', 'dist');
      await mkdir(dist, { recursive: true });
      await writeFile(path.join(dist, 'index.html'), `<!doctype html><title>${id}</title>`);
    }
    await symlink(path.join(versions, 'v1'), path.join(builds, 'current'));

    server = spawn(process.execPath, [path.join(process.cwd(), 'server/hostinger.mjs')], {
      cwd: path.join(versions, 'v1', 'nodejs'),
      env: { ...process.env, PORT: String(PORT), STATIC_ROOT: '' },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    server.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(`[hostinger] ${chunk.toString()}`);
    });

    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        const res = await request('/');
        if (res.status === 200) return;
      } catch {
        // Not up yet.
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('the server did not start');
  }, 20_000);

  afterAll(async () => {
    server?.kill('SIGTERM');
    if (root) await rm(root, { recursive: true, force: true });
  });

  test('serves the build the pointer names', async () => {
    const res = await request('/');
    expect(res.status).toBe(200);
    expect(res.body).toContain('<title>v1</title>');
  });

  test('picks up a new build when the pointer moves, without a restart', async () => {
    const builds = path.join(root, 'hbuilds');
    const versions = path.join(builds, 'versions');
    await rm(path.join(builds, 'current'));
    await symlink(path.join(versions, 'v2'), path.join(builds, 'current'));

    // The root is re-resolved every couple of seconds, so give it a few.
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const res = await request('/');
      if (res.body.includes('<title>v2</title>')) {
        expect(res.status).toBe(200);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const res = await request('/');
    expect(res.body).toContain('<title>v2</title>');
  }, 20_000);
});
