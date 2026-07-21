import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteSessionButton from "./delete-session-button";

type SessionRow = {
  id: string;
  title: string;
  session_date: string;
  is_active: boolean;
  attendance: { count: number }[];
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, session_date, is_active, attendance(count)")
    .order("session_date", { ascending: false })
    .returns<SessionRow[]>();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sessions</h1>
        <Link
          href="/admin/sessions/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + New Session
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No sessions yet. Click above to create your first one.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/10 rounded-lg border border-black/10 dark:border-white/10">
          {sessions.map((session) => (
            <li key={session.id} className="relative">
              <Link
                href={`/admin/sessions/${session.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/[.02] dark:hover:bg-white/[.04]"
              >
                <div>
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-zinc-500">{session.session_date}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span>
                    {session.attendance?.[0]?.count ?? 0} checked in
                    {!session.is_active && " (closed)"}
                  </span>
                  <DeleteSessionButton
                    sessionId={session.id}
                    sessionTitle={session.title}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
