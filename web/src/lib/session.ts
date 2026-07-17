import { createClient } from "@/lib/supabase/client";

export async function getAccessToken(): Promise<string> {
  const token = await getAccessTokenOrNull();
  if (!token) {
    throw new Error("Not signed in");
  }
  return token;
}

export async function getAccessTokenOrNull(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    return null;
  }
  return session.access_token;
}
