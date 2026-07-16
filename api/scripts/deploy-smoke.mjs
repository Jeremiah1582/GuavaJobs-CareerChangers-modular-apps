#!/usr/bin/env node
/**
 * Smoke-test a deployed API: /health (+ optional authenticated /me).
 *
 * Usage:
 *   node scripts/deploy-smoke.mjs
 *   API_BASE=http://host/api/v1 ACCESS_TOKEN=eyJ... node scripts/deploy-smoke.mjs
 */

const base = (
  process.env.API_BASE ||
  'http://n106xgrqkd5sxussrt8lq40k.46.224.155.225.sslip.io/api/v1'
).replace(/\/$/, '');

const token = process.env.ACCESS_TOKEN;

async function get(path, auth = false) {
  const headers = { Accept: 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { headers });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 300);
  }
  return { res, body };
}

let failed = false;

const health = await get('/health');
console.log('GET /health', health.res.status, JSON.stringify(health.body));
if (!health.res.ok) failed = true;
if (health.body?.schema && health.body.schema !== 'ready') {
  console.error('FAIL: schema not ready — run prisma migrate deploy on Coolify DB');
  failed = true;
}

if (token) {
  const me = await get('/me', true);
  console.log('GET /me', me.res.status, JSON.stringify(me.body));
  if (!me.res.ok) failed = true;
} else {
  console.log('SKIP /me (set ACCESS_TOKEN to test authenticated sync)');
}

process.exit(failed ? 1 : 0);
