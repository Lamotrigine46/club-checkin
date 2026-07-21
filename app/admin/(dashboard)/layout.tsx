import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-semibold tracking-wide">
              KCL RACING
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium">
              <Link href="/admin">Sessions</Link>
              <Link href="/admin/members">Members</Link>
              <Link href="/admin/ranking">Ranking</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span>{user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
