#!/usr/bin/env node
/**
 * Daily canary — deployed /health + one public ATS board fetch.
 * Exit 0 on success; non-zero + stderr on failure.
 *
 * Env:
 *   CANARY_HEALTH_URL  (default: production sslip.io /api/v1/health)
 *   CANARY_ATS_URL     (default: Greenhouse Stripe board jobs list)
 */

const HEALTH_URL =
  process.env.CANARY_HEALTH_URL ||
  'http://n106xgrqkd5sxussrt8lq40k.46.224.155.225.sslip.io/api/v1/health';

const ATS_URL =
  process.env.CANARY_ATS_URL ||
  'https://boards-api.greenhouse.io/v1/boards/stripe/jobs';

const TIMEOUT_MS = Number(process.env.CANARY_TIMEOUT_MS || 15_000);

async function check(label, url, assertOk) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 200);
    }
    assertOk(res, body);
    console.log(
      JSON.stringify({
        ok: true,
        check: label,
        url,
        status: res.status,
        ms: Date.now() - started,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        ok: false,
        check: label,
        url,
        error: message,
        ms: Date.now() - started,
      }),
    );
    throw err;
  }
}

let failed = false;

try {
  await check('health', HEALTH_URL, (res, body) => {
    if (!res.ok) {
      throw new Error(`health HTTP ${res.status}`);
    }
    if (!body || typeof body !== 'object' || !('status' in body)) {
      throw new Error('health response missing status');
    }
    if (body.status !== 'ok' && body.status !== 'degraded') {
      throw new Error(`unexpected health status: ${String(body.status)}`);
    }
    if (body.schema && body.schema !== 'ready') {
      throw new Error(
        `database schema not ready (${String(body.schema)}) — run prisma migrate deploy`,
      );
    }
  });
} catch {
  failed = true;
}

try {
  await check('ats-board', ATS_URL, (res, body) => {
    if (!res.ok) {
      throw new Error(`ATS board HTTP ${res.status}`);
    }
    const jobs = body && typeof body === 'object' ? body.jobs : null;
    if (!Array.isArray(jobs) || jobs.length === 0) {
      throw new Error('ATS board returned no jobs');
    }
  });
} catch {
  failed = true;
}

if (failed) {
  process.exit(1);
}
