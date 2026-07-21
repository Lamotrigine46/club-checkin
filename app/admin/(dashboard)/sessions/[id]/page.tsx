import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LiveSessionPanel from "./live-panel";
import DeleteSessionButton from "../../delete-session-button";

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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{session.title}</h1>
          <p className="text-sm text-zinc-500">{session.session_date}</p>
        </div>
        <DeleteSessionButton
          sessionId={session.id}
          sessionTitle={session.title}
          redirectTo="/admin"
        />
      </div>
      <LiveSessionPanel sessionId={session.id} />
    </div>
  );
}
