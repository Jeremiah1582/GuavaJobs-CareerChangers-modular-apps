import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/app/profile" className="font-semibold tracking-tight">
            GuavaJobs
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/app/jobs"
              className="text-muted-foreground hover:text-foreground"
            >
              Jobs
            </Link>
            <Link
              href="/app/applications"
              className="text-muted-foreground hover:text-foreground"
            >
              Applications
            </Link>
            <Link
              href="/app/profile"
              className="text-muted-foreground hover:text-foreground"
            >
              Profile
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
