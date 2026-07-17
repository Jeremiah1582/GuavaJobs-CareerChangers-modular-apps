import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { HAS_APPS_COOKIE } from "@/lib/applications";

/** Default home: tracker once the user has ≥1 application. */
export default async function AppHomePage() {
  const jar = await cookies();
  const hasApps = jar.get(HAS_APPS_COOKIE)?.value === "1";
  redirect(hasApps ? "/app/applications" : "/app/jobs");
}
