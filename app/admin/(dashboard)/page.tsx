import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
        <h1 className="text-xl font-semibold">Session 列表</h1>
        <Link
          href="/admin/sessions/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + 新建 Session
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <p className="text-sm text-zinc-500">还没有任何 session，点击右上角创建第一个。</p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/10 rounded-lg border border-black/10 dark:border-white/10">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/admin/sessions/${session.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/[.02] dark:hover:bg-white/[.04]"
              >
                <div>
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-zinc-500">{session.session_date}</p>
                </div>
                <div className="text-sm text-zinc-500">
                  {session.attendance?.[0]?.count ?? 0} 人已签到
                  {!session.is_active && "（已关闭）"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
