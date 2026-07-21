"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteSessionButton({
  sessionId,
  sessionTitle,
  redirectTo,
}: {
  sessionId: string;
  sessionTitle: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Delete session "${sessionTitle}"? This will also delete its attendance records.`)) {
      return;
    }

    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
    setDeleting(false);

    if (error) {
      window.alert("Failed to delete: " + error.message);
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-600 hover:underline disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
