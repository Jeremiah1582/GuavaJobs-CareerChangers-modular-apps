import { AppNav } from "@/components/app/app-nav";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-[100dvh]"
      style={{ background: "var(--wash-hero)" }}
    >
      <AppNav />
      {children}
    </div>
  );
}
