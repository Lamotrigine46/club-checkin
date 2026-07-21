import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyQrToken } from "@/lib/qrToken";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId as string | undefined;
  const token = body?.token as string | undefined;
  const memberId = body?.memberId as string | undefined;

  if (!sessionId || !token || !memberId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  if (!verifyQrToken(sessionId, token)) {
    return NextResponse.json(
      { error: "二维码已过期，请重新扫描最新的二维码" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, is_active")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "该 session 不存在" }, { status: 404 });
  }
  if (!session.is_active) {
    return NextResponse.json({ error: "该 session 已关闭签到" }, { status: 400 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "找不到该成员" }, { status: 404 });
  }

  const { error } = await supabase
    .from("attendance")
    .insert({ session_id: sessionId, member_id: memberId });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "你已经签到过了" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "签到失败：" + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
