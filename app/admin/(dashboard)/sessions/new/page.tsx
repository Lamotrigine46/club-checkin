"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewSessionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        title: title.trim(),
        session_date: sessionDate,
        created_by: user?.id,
      })
      .select("id")
      .single();

    setLoading(false);

    if (error || !data) {
      setError("创建失败：" + error?.message);
      return;
    }

    router.push(`/admin/sessions/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-semibold">新建 Session</h1>
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-black/10 dark:border-white/10 p-6"
      >
        <label className="mb-1 block text-sm font-medium" htmlFor="title">
          标题
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：第 5 次例会"
          className="mb-4 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="date">
          日期
        </label>
        <input
          id="date"
          type="date"
          required
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          className="mb-4 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-foreground py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? "创建中..." : "创建并生成二维码"}
        </button>
      </form>
    </div>
  );
}
