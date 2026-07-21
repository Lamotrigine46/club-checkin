import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

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
    const { data: counts } = (await supabase.rpc("attendance_counts_for_sessions", {
      p_session_ids: sessionIds,
    })) as { data: { member_id: string; attended_count: number }[] | null };

    for (const row of counts ?? []) {
      attendanceCounts[row.member_id] = Number(row.attended_count);
    }
  }

  const ranking = (members ?? [])
    .map((m) => {
      const attended = attendanceCounts[m.id] ?? 0;
      const percentage = totalSessions > 0 ? (attended / totalSessions) * 100 : 0;
      return { ...m, attended, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage || b.attended - a.attended);

  const averagePercentage =
    ranking.length > 0
      ? ranking.reduce((sum, m) => sum + m.percentage, 0) / ranking.length
      : 0;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Attendance Ranking</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total Sessions" value={String(totalSessions)} />
        <StatCard label="Total Members" value={String(members?.length ?? 0)} />
        <StatCard
          label="Average Attendance Rate"
          value={totalSessions > 0 ? `${averagePercentage.toFixed(1)}%` : "—"}
        />
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3 text-sm">
        <div>
          <label className="mb-1 block text-zinc-500">Start Date</label>
          <input
            type="date"
            name="start"
            defaultValue={start}
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-zinc-500">End Date</label>
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
          Filter
        </button>
        <Link href="/admin/ranking" className="text-zinc-500 hover:underline">
          Reset
        </Link>
      </form>

      <p className="mb-4 text-sm text-zinc-500">
        {totalSessions} session{totalSessions === 1 ? "" : "s"} in range
      </p>

      {totalSessions === 0 ? (
        <p className="text-sm text-zinc-500">No sessions in this range yet.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-left text-zinc-500">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Attended</th>
              <th className="py-2">Attendance Rate</th>
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
