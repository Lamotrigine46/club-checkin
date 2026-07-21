"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = {
  id: string;
  name: string;
  student_id: string | null;
};

async function loadMembers(): Promise<Member[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("members")
    .select("id, name, student_id")
    .order("name");
  return data ?? [];
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMembers().then((data) => {
      if (!cancelled) {
        setMembers(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("members")
      .insert({ name: name.trim(), student_id: studentId.trim() || null });

    if (error) {
      setError("Failed to add: " + error.message);
      return;
    }

    setName("");
    setStudentId("");
    setMembers(await loadMembers());
  }

  async function handleBulkImport() {
    setError(null);
    const names = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("members")
      .insert(names.map((n) => ({ name: n })));

    if (error) {
      setError("Bulk import failed: " + error.message);
      return;
    }

    setBulkText("");
    setMembers(await loadMembers());
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      setError("Failed to delete: " + error.message);
      return;
    }
    setMembers(await loadMembers());
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Members</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <form
          onSubmit={handleAdd}
          className="rounded-lg border border-black/10 dark:border-white/10 p-4"
        >
          <h2 className="mb-3 text-sm font-medium">Add One</h2>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mb-2 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="Student ID (optional)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="mb-3 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Add
          </button>
        </form>

        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <h2 className="mb-3 text-sm font-medium">Bulk Import (one name per line)</h2>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            placeholder={"John Smith\nJane Doe"}
            className="mb-3 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={handleBulkImport}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Import
          </button>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium text-zinc-500">
        {members.length} members total
      </h2>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/10 rounded-lg border border-black/10 dark:border-white/10">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between px-4 py-2 text-sm"
            >
              <span>
                {m.name}
                {m.student_id && (
                  <span className="ml-2 text-zinc-500">{m.student_id}</span>
                )}
              </span>
              <button
                onClick={() => handleDelete(m.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
