import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;
  const supabase = await createClient();

  let sessionsQuery = supabase.from("sessions").select("id, session_date");
  if (start) sessionsQuery = sessionsQuery.gte("session_date", start);
  if (end) sessionsQuery = sessionsQuery.lte("session_date", end);
  const { data: sessions } = await sessionsQuery;

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const totalSessions = sessionIds.length;

  const { data: members } = await supabase
    .from("members")
    .select("id, name")
    .order("name");

  const attendanceCounts: Record<string, number> = {};
  if (totalSessions > 0) {
    const { data: attendanceRows } = await supabase
      .from("attendance")
      .select("member_id")
      .in("session_id", sessionIds);

    for (const row of attendanceRows ?? []) {
      attendanceCounts[row.member_id] = (attendanceCounts[row.member_id] ?? 0) + 1;
    }
  }

  const ranking = (members ?? [])
    .map((m) => {
      const attended = attendanceCounts[m.id] ?? 0;
      const percentage = totalSessions > 0 ? (attended / totalSessions) * 100 : 0;
      return { ...m, attended, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage || b.attended - a.attended);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">出勤排名</h1>

      <form className="mb-6 flex flex-wrap items-end gap-3 text-sm">
        <div>
          <label className="mb-1 block text-zinc-500">开始日期</label>
          <input
            type="date"
            name="start"
            defaultValue={start}
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-zinc-500">结束日期</label>
          <input
            type="date"
            name="end"
            defaultValue={end}
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-1.5 font-medium text-background"
        >
          筛选
        </button>
        <Link href="/admin/ranking" className="text-zinc-500 hover:underline">
          重置
        </Link>
      </form>

      <p className="mb-4 text-sm text-zinc-500">
        统计范围内共 {totalSessions} 场 session
      </p>

      {totalSessions === 0 ? (
        <p className="text-sm text-zinc-500">该范围内还没有 session，无法计算出勤率。</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-left text-zinc-500">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">姓名</th>
              <th className="py-2 pr-4">出勤</th>
              <th className="py-2">出勤率</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((m, i) => (
              <tr key={m.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4 text-zinc-500">{i + 1}</td>
                <td className="py-2 pr-4">{m.name}</td>
                <td className="py-2 pr-4">
                  {m.attended} / {totalSessions}
                </td>
                <td className="py-2">{m.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
