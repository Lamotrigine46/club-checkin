"use client";

import { useMemo, useState } from "react";

type Member = { id: string; name: string };

export default function CheckinForm({
  sessionId,
  token,
  members,
}: {
  sessionId: string;
  token: string;
  members: Member[];
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [query, members]);

  async function handleSubmit() {
    if (!selectedId) return;
    setStatus("submitting");
    setMessage(null);

    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, token, memberId: selectedId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "签到失败");
      return;
    }

    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="text-center">
        <p className="text-lg font-medium">签到成功！</p>
      </div>
    );
  }

  return (
    <div>
      <input
        autoFocus
        placeholder="搜索你的名字"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId(null);
        }}
        className="mb-3 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
      />

      <ul className="mb-4 max-h-64 divide-y divide-black/10 dark:divide-white/10 overflow-y-auto rounded-md border border-black/10 dark:border-white/10">
        {filtered.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={`w-full px-3 py-2 text-left text-sm ${
                selectedId === m.id
                  ? "bg-foreground text-background"
                  : "hover:bg-black/[.03] dark:hover:bg-white/[.06]"
              }`}
            >
              {m.name}
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-zinc-500">没有找到匹配的名字</li>
        )}
      </ul>

      {message && <p className="mb-4 text-sm text-red-600">{message}</p>}

      <button
        onClick={handleSubmit}
        disabled={!selectedId || status === "submitting"}
        className="w-full rounded-md bg-foreground py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {status === "submitting" ? "签到中..." : "确认签到"}
      </button>
    </div>
  );
}
