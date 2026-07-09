import fs from 'fs';

const env = {};
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const BASE = 'http://127.0.0.1:3000/api/v1';
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function record(method, path, status, ok, note = '') {
  results.push({ method, path, status, ok, note });
}

async function req(method, path, { token, body, form, expect } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  let fetchBody = body;
  if (body && !form) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }
  if (form) fetchBody = form;
  const res = await fetch(BASE + path, { method, headers, body: fetchBody });
  let json = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  } else if (method === 'POST' && path.includes('pdf')) {
    json = { pdfBytes: (await res.arrayBuffer()).byteLength };
  } else {
    json = { raw: (await res.text()).slice(0, 80) };
  }
  const ok = expect ? expect.includes(res.status) : res.ok;
  return { status: res.status, json, ok };
}

const authRes = await fetch(env.SUPABASE_URL + '/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.SEED_USER_EMAIL, password: env.SEED_USER_PASSWORD }),
});
const token = (await authRes.json()).access_token;
if (!token) {
  console.error('AUTH FAILED');
  process.exit(1);
}

let r = await req('GET', '/health');
record('GET', '/health', r.status, r.status === 200);

r = await req('GET', '/me');
record('GET', '/me (no auth)', r.status, r.status === 401);

r = await req('GET', '/me', { token });
record('GET', '/me', r.status, r.status === 200);
const me = r.json;
const profileId = me.defaultProfileId;

r = await req('PATCH', '/me', { token, body: { name: me.name }, expect: [200] });
record('PATCH', '/me', r.status, r.ok);

r = await req('GET', '/profiles', { token });
record('GET', '/profiles', r.status, r.ok);

r = await req('POST', '/profiles', {
  token,
  body: {
    profileTitle: 'QA Test',
    jobTitle: 'Tester',
    seniority: 'MID',
    primaryIndustry: 'SOFTWARE',
    isDefault: false,
  },
  expect: [201],
});
record('POST', '/profiles', r.status, r.status === 201);

r = await req('GET', `/profiles/${profileId}`, { token });
record('GET', '/profiles/:id', r.status, r.ok, r.json?.currentCv ? 'has cv meta' : 'no cv');

r = await req('PATCH', `/profiles/${profileId}`, {
  token,
  body: { profileTitle: 'Software Engineering' },
  expect: [200],
});
record('PATCH', '/profiles/:id', r.status, r.ok);

const cvText = 'Jane Developer\nTypeScript React Node.js AWS CI/CD\nLondon UK';
const form = new FormData();
form.append('file', new Blob([cvText], { type: 'text/plain' }), 'qa-cv.txt');
r = await req('POST', `/profiles/${profileId}/cv`, { token, form, expect: [201] });
record('POST', '/profiles/:id/cv', r.status, r.status === 201);

await sleep(1500);
r = await req('GET', `/profiles/${profileId}/cv/download`, { token });
record('GET', '/profiles/:id/cv/download', r.status, r.ok, r.json?.signedUrl ? 'signed url ok' : '');

const atsStart = Date.now();
r = await req('POST', `/profiles/${profileId}/ats-assessment`, { token, expect: [201, 409] });
record(
  'POST',
  '/profiles/:id/ats-assessment',
  r.status,
  [201, 409].includes(r.status),
  `${((Date.now() - atsStart) / 1000).toFixed(0)}s`,
);

r = await req('PATCH', `/profiles/${profileId}`, {
  token,
  body: { autofillAnswers: { noticePeriodWeeks: 4 } },
  expect: [200],
});
record('PATCH', '/profiles/:id (autofillAnswers)', r.status, r.ok, `weeks=${r.json?.autofillAnswers?.noticePeriodWeeks}`);

r = await req('GET', '/jobs/search?q=developer&country=gb&page=1', { token });
record('GET', '/jobs/search', r.status, r.ok, `results=${r.json?.results?.length}`);
const jobKey = r.json?.results?.[0]?.canonicalKey;

if (jobKey) {
  r = await req('GET', `/jobs/${encodeURIComponent(jobKey)}`, { token });
  record('GET', '/jobs/:canonicalKey', r.status, r.ok, r.json?.description ? 'has JD' : '');
} else {
  record('GET', '/jobs/:canonicalKey', 0, false, 'skipped - no job');
}

const appsRes = await req('GET', '/applications', { token });
record('GET', '/applications', appsRes.status, appsRes.ok, `count=${Array.isArray(appsRes.json) ? appsRes.json.length : '?'}`);

r = await req('POST', '/applications', {
  token,
  body: {
    profileId,
    companyName: 'QA Corp',
    jobRoleTitle: 'QA Engineer',
    sourceOfListing: 'Manual test',
  },
  expect: [201],
});
record('POST', '/applications (manual)', r.status, r.status === 201);
const manualAppId = r.json?.id;

let appId = Array.isArray(appsRes.json)
  ? appsRes.json.find((a) => a.generationStatus === 'COMPLETED')?.id
  : null;

if (!appId && jobKey) {
  r = await req('POST', '/applications/generate', {
    token,
    body: { profileId, canonicalJobKey: jobKey },
    expect: [200, 202],
  });
  record('POST', '/applications/generate', r.status, [200, 202].includes(r.status));
  appId = r.json?.id;
  for (let i = 0; i < 3; i++) {
    await sleep(2000);
    const p = await req('GET', `/applications/${appId}`, { token });
    if (p.json?.generationStatus === 'COMPLETED' || p.json?.generationStatus === 'FAILED') break;
  }
  const final = await req('GET', `/applications/${appId}`, { token });
  record('GET', '/applications/:id (poll)', final.status, final.ok, `status=${final.json?.generationStatus}`);
} else if (appId) {
  r = await req('GET', `/applications/${appId}`, { token });
  record('GET', '/applications/:id', r.status, r.ok, `status=${r.json?.generationStatus}`);
}

const testAppId = appId || manualAppId;
if (testAppId) {
  r = await req('PATCH', `/applications/${testAppId}`, {
    token,
    body: { userFitRating: 75 },
    expect: [200],
  });
  record('PATCH', '/applications/:id', r.status, r.ok);

  r = await req('POST', `/applications/${testAppId}/events`, {
    token,
    body: { eventType: 'NOTE', occurredAt: new Date().toISOString(), content: 'QA test note' },
    expect: [201],
  });
  record('POST', '/applications/:id/events', r.status, r.status === 201);
  const eventId = r.json?.id;

  r = await req('GET', `/applications/${testAppId}/events`, { token });
  record('GET', '/applications/:id/events', r.status, r.ok);

  if (eventId) {
    r = await req('PATCH', `/applications/${testAppId}/events/${eventId}`, {
      token,
      body: { content: 'Updated note' },
      expect: [200],
    });
    record('PATCH', '/applications/:id/events/:eventId', r.status, r.ok);
  }

  const appDetail = await req('GET', `/applications/${testAppId}`, { token });
  if (appDetail.json?.coverLetterContent) {
    r = await req('POST', `/applications/${testAppId}/cover-letter/pdf`, { token, expect: [201] });
    record('POST', '/applications/:id/cover-letter/pdf', r.status, r.status === 201, `${r.json?.pdfBytes} bytes`);
  } else {
    record('POST', '/applications/:id/cover-letter/pdf', 0, false, 'skipped - no cover letter');
  }

  if (appDetail.json?.generationMode === 'AI' && appDetail.json?.generationStatus === 'COMPLETED') {
    r = await req('POST', `/applications/${testAppId}/regenerate`, { token, expect: [202] });
    record('POST', '/applications/:id/regenerate', r.status, r.status === 202, 'enqueued');
  }

  if (manualAppId) {
    r = await req('POST', `/applications/${manualAppId}/generate-cover-letter`, {
      token,
      body: {
        pastedJobDescription:
          'We need a QA engineer with TypeScript experience. Remote role. Must know testing frameworks.',
      },
      expect: [202, 402],
    });
    record('POST', '/applications/:id/generate-cover-letter', r.status, [202, 402].includes(r.status));
  }

  if (eventId) {
    r = await req('DELETE', `/applications/${testAppId}/events/${eventId}`, { token, expect: [200] });
    record('DELETE', '/applications/:id/events/:eventId', r.status, r.ok);
  }

  r = await req('GET', `/applications/${testAppId}/autofill-payload`, { token });
  record(
    'GET',
    '/applications/:id/autofill-payload',
    r.status,
    r.ok,
    r.json?.atsSupported ? `ats=${r.json?.atsType}` : 'no template',
  );
}

r = await req('POST', '/profiles', { token, body: { profileTitle: 'x' }, expect: [400] });
record('POST', '/profiles (invalid)', r.status, r.status === 400, 'validation ok');

r = await req('GET', '/jobs/not-a-valid-key', { token, expect: [404] });
record('GET', '/jobs/:key (invalid)', r.status, r.status === 404);

console.log('\n=== ENDPOINT TEST REPORT ===\n');
const passed = results.filter((x) => x.ok).length;
const failed = results.filter((x) => !x.ok);
for (const x of results) {
  const icon = x.ok ? 'PASS' : 'FAIL';
  console.log(`${icon}  ${x.method.padEnd(6)} ${x.path.padEnd(45)} ${x.status}  ${x.note}`);
}
console.log(`\n${passed}/${results.length} passed`);
if (failed.length) {
  console.log('\nFailed:');
  failed.forEach((f) => console.log(` - ${f.method} ${f.path}: ${f.status} ${f.note}`));
}
