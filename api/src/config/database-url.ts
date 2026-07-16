/**
 * Normalize Supabase pooler URLs for Prisma.
 * Transaction pooler (6543) requires `?pgbouncer=true`.
 */
export function normalizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.port === '6543' && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Extract Supabase project ref from `https://<ref>.supabase.co`. */
export function supabaseProjectRef(supabaseUrl: string): string | null {
  try {
    const host = new URL(supabaseUrl).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export function deriveJwksUrl(supabaseUrl: string): string {
  const base = supabaseUrl.replace(/\/$/, '');
  return `${base}/auth/v1/.well-known/jwks.json`;
}
