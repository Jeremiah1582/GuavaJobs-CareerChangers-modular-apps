import { createClient } from "@/lib/supabase/client";

export async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message || "Could not read session");
  }
  if (!session?.access_token) {
    throw new Error("Not signed in");
  }
  return session.access_token;
}
