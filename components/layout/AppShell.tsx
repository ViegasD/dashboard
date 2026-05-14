import { TopNav } from "@/components/layout/TopNav";
import { auth } from "@/lib/auth";

const ADMIN_EMAILS = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? "";
  const adminEmails = ADMIN_EMAILS();
  const isAdmin = adminEmails.length === 0 || adminEmails.includes(email);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav isAdmin={isAdmin} />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
