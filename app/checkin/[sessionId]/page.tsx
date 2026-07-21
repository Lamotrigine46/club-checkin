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
    return <Message>该签到链接无效</Message>;
  }
  if (!session.is_active) {
    return <Message>该 session 已关闭签到</Message>;
  }
  if (!t || !verifyQrToken(sessionId, t)) {
    return <Message>二维码已过期，请重新扫描最新的二维码</Message>;
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, name")
    .order("name");

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold">{session.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">请选择你的名字完成签到</p>
      <CheckinForm sessionId={sessionId} token={t} members={members ?? []} />
    </div>
  );
}
