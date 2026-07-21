import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LiveSessionPanel from "./live-panel";

export default async function SessionLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, session_date")
    .eq("id", id)
    .single();

  if (!session) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{session.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">{session.session_date}</p>
      <LiveSessionPanel sessionId={session.id} />
    </div>
  );
}
