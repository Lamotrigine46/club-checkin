import { createClient } from "@/lib/supabase/server";
import { verifyQrToken } from "@/lib/qrToken";
import CheckinForm from "./checkin-form";

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 text-center">
      <p className="text-lg">{children}</p>
    </div>
  );
}

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { sessionId } = await params;
  const { t } = await searchParams;

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, is_active")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return <Message>This check-in link is invalid</Message>;
  }
  if (!session.is_active) {
    return <Message>Check-in is closed for this session</Message>;
  }
  if (!t || !verifyQrToken(sessionId, t)) {
    return <Message>QR code expired, please scan the latest one</Message>;
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, name")
    .order("name");

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <p className="mb-1 text-sm font-semibold tracking-wide text-zinc-500">
        KCL RACING
      </p>
      <h1 className="mb-1 text-xl font-semibold">{session.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">Select your name to check in</p>
      <CheckinForm sessionId={sessionId} token={t} members={members ?? []} />
    </div>
  );
}
