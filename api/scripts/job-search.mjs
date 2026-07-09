#!/usr/bin/env node
/**
 * Live job search CLI — prints results with job ad URLs.
 * Usage: node scripts/job-search.mjs "solutions engineer" [--country=gb] [--page=1]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const args = process.argv.slice(2);
let query = 'developer';
let country = 'gb';
let page = 1;

for (const arg of args) {
  if (arg.startsWith('--country=')) country = arg.slice(10);
  else if (arg.startsWith('--page=')) page = Number(arg.slice(7)) || 1;
  else if (!arg.startsWith('--')) query = arg;
}

const BASE = process.env.API_BASE ?? 'http://127.0.0.1:3000/api/v1';

const health = await fetch(`${BASE}/health`);
if (!health.ok) {
  console.error('\n❌ API not running. Start it first:\n   cd apps/api && npm run start:dev\n');
  process.exit(1);
}

const authRes = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.SEED_USER_EMAIL, password: env.SEED_USER_PASSWORD }),
});
const token = (await authRes.json()).access_token;
if (!token) {
  console.error('❌ Auth failed — check SEED_USER_EMAIL / SEED_USER_PASSWORD in .env');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };
const params = new URLSearchParams({ q: query, country, page: String(page) });
const res = await fetch(`${BASE}/jobs/search?${params}`, { headers });
const data = await res.json();

if (!res.ok) {
  console.error('Search failed:', res.status, data);
  process.exit(1);
}

function adzunaPageUrl(canonicalKey, applyUrl) {
  const m = canonicalKey.match(/^adzuna:gb:(\d+)$/i) ?? canonicalKey.match(/^adzuna:ie:(\d+)$/i);
  if (m) return `https://www.adzuna.co.uk/jobs/details/${m[1]}`;
  return null;
}

console.log('');
console.log('═'.repeat(90));
console.log(`  JOB SEARCH: "${query}"  |  country=${country}  page=${page}`);
console.log(`  Total matches: ${data.totalResults}  |  ${data.attribution}`);
console.log('═'.repeat(90));
console.log('');

for (const [i, job] of data.results.entries()) {
  const salary =
    job.salaryMin != null || job.salaryMax != null
      ? `£${job.salaryMin ?? '?'}–${job.salaryMax ?? '?'}`
      : 'salary not listed';
  const cleanAdzuna = adzunaPageUrl(job.canonicalKey, job.applyUrl);

  console.log(`${String(i + 1).padStart(2)}. ${job.title}`);
  console.log(`    Company:     ${job.company}`);
  console.log(`    Location:    ${job.location ?? '—'}`);
  console.log(`    Salary:      ${salary}`);
  console.log(`    ATS:         ${job.atsType}`);
  console.log(`    Job ad URL:  ${job.applyUrl}`);
  if (cleanAdzuna && !job.applyUrl.includes('/jobs/details/')) {
    console.log(`    Browse URL:  ${cleanAdzuna}`);
  }
  console.log('');
}

console.log('─'.repeat(90));
console.log(`  Showing ${data.results.length} of ${data.totalResults} results`);
console.log('  Expand first result:  node scripts/job-search.mjs "query" --expand');
console.log('  Run again:            node scripts/job-search.mjs "your query" --country=gb --page=2');
console.log('─'.repeat(90));
console.log('');

if (args.includes('--expand')) {
  const first = data.results[0];
  if (!first) {
    console.error('No results to expand.');
    process.exit(1);
  }
  const detailRes = await fetch(
    `${BASE}/jobs/${encodeURIComponent(first.canonicalKey)}?expand=ats`,
    { headers },
  );
  const detail = await detailRes.json();
  if (!detailRes.ok) {
    console.error('Expand failed:', detail);
    process.exit(1);
  }

  console.log('═'.repeat(90));
  console.log('  EXPANDED DETAIL — first result');
  console.log('═'.repeat(90));
  console.log(`  Title:       ${detail.title}`);
  console.log(`  Company:     ${detail.company}`);
  console.log(`  Location:    ${detail.location ?? '—'}`);
  console.log(`  Source:      ${detail.atsType} (${detail.hasFullDescription ? 'full JD' : 'summary only'})`);
  console.log(`  Apply URL:   ${detail.applyUrl}`);
  console.log(`  Key:         ${detail.canonicalKey}`);
  console.log(`  Description: ${detail.description?.length ?? 0} characters`);
  console.log('─'.repeat(90));
  console.log(detail.description ?? '(no description)');
  console.log('─'.repeat(90));
  console.log('');
}
