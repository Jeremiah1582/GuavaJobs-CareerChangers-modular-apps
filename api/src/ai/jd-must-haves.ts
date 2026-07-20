/**
 * Lightweight JD must-have extraction for ATS context (no extra LLM call).
 * Heuristic only — used as prompt context alongside industry criteria.
 */

export type JdMustHaves = {
  mustHaveSkills: string[];
  niceToHaves: string[];
  certifications: string[];
  yearsRequired: number | null;
  domain: string | null;
  tools: string[];
};

const CERT_PATTERNS: RegExp[] = [
  /\b(AWS|Azure|GCP|Google Cloud)\s*(Certified|certification)?\b/gi,
  /\b(CISSP|CompTIA\s+\w+|PMP|PRINCE2|Scrum\s*Master|CSM|CPA|CFA|ACA|Gas\s*Safe|WRAS)\b/gi,
  /\b([A-Z][A-Za-z0-9+.#]{1,20})\s+certificat(?:e|ion)\b/gi,
];

const YEARS_PATTERN =
  /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp\.?)/i;

const MUST_SECTION =
  /(?:requirements?|must[- ]haves?|you(?:'ll| will) (?:need|have)|essential|required skills?)[:\s]+([\s\S]{20,1200}?)(?=(?:nice[- ]to[- ]have|preferred|responsibilities|about (?:us|the)|benefits|$))/i;

const NICE_SECTION =
  /(?:nice[- ]to[- ]haves?|preferred|bonus|desirable)[:\s]+([\s\S]{20,800}?)(?=(?:requirements?|responsibilities|about (?:us|the)|benefits|$))/i;

/** Common tech/tool tokens to pull when capitalized or listed. */
const TOOL_TOKEN =
  /\b(?:React|Angular|Vue|Node\.?js|TypeScript|JavaScript|Python|Java|Kotlin|Swift|Go|Rust|SQL|PostgreSQL|MySQL|MongoDB|Redis|Kafka|Kubernetes|Docker|Terraform|Helm|AWS|Azure|GCP|Salesforce|HubSpot|Excel|Tableau|Power\s*BI|Figma|Jira|Git|CI\/CD|GraphQL|REST)\b/gi;

export function extractJdMustHaves(jobDescription: string): JdMustHaves {
  const jd = jobDescription.slice(0, 40_000);
  const mustBlock = MUST_SECTION.exec(jd)?.[1] ?? '';
  const niceBlock = NICE_SECTION.exec(jd)?.[1] ?? '';

  const mustHaveSkills = uniqueTokens([
    ...splitListish(mustBlock),
    ...matchTools(mustBlock || jd).slice(0, 12),
  ]).slice(0, 20);

  const niceToHaves = uniqueTokens([
    ...splitListish(niceBlock),
    ...matchTools(niceBlock).slice(0, 8),
  ]).slice(0, 15);

  const certifications = uniqueTokens(
    CERT_PATTERNS.flatMap((re) => [...jd.matchAll(re)].map((m) => m[0]!.trim())),
  ).slice(0, 10);

  const yearsMatch = YEARS_PATTERN.exec(jd);
  const yearsRequired = yearsMatch ? Number(yearsMatch[1]) : null;

  const tools = uniqueTokens(matchTools(jd)).slice(0, 20);

  const domain = inferDomain(jd);

  return {
    mustHaveSkills,
    niceToHaves,
    certifications,
    yearsRequired:
      yearsRequired !== null && Number.isFinite(yearsRequired)
        ? yearsRequired
        : null,
    domain,
    tools,
  };
}

function matchTools(text: string): string[] {
  return [...text.matchAll(TOOL_TOKEN)].map((m) => m[0]!.replace(/\s+/g, ' '));
}

function splitListish(block: string): string[] {
  if (!block.trim()) return [];
  return block
    .split(/[\n•·|;,]/)
    .map((s) => s.replace(/^[-*]\s*/, '').trim())
    .filter((s) => s.length >= 2 && s.length <= 80)
    .filter((s) => !/^(and|or|the|with|for|to)$/i.test(s));
}

function uniqueTokens(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(raw.trim());
  }
  return out;
}

function inferDomain(jd: string): string | null {
  const lower = jd.toLowerCase();
  if (/\b(software|engineer|developer|fullstack|full-stack|backend|frontend)\b/.test(lower))
    return 'software';
  if (/\b(sales|account executive|bdr|sdr|quota)\b/.test(lower)) return 'sales';
  if (/\b(data analyst|analytics|sql|tableau|power bi)\b/.test(lower))
    return 'data';
  if (/\b(finance|accounting|audit|fp&a)\b/.test(lower)) return 'finance';
  if (/\b(marketing|seo|content|campaign)\b/.test(lower)) return 'marketing';
  if (/\b(product manager|product owner|roadmap)\b/.test(lower)) return 'product';
  if (/\b(hr|people ops|recruiter|talent)\b/.test(lower)) return 'hr';
  if (/\b(designer|figma|ux|ui)\b/.test(lower)) return 'design';
  if (/\b(operations|ops|supply chain|logistics)\b/.test(lower)) return 'operations';
  if (/\b(plumb|electrician|trades|hvac|gas safe)\b/.test(lower)) return 'trades';
  return null;
}
