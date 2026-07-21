import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyQrToken } from "@/lib/qrToken";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId as string | undefined;
  const token = body?.token as string | undefined;
  const memberId = body?.memberId as string | undefined;

  if (!sessionId || !token || !memberId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  if (!verifyQrToken(sessionId, token)) {
    return NextResponse.json(
      { error: "QR code expired, please scan the latest one" },
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
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (!session.is_active) {
    return NextResponse.json({ error: "Check-in is closed for this session" }, { status: 400 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("attendance")
    .insert({ session_id: sessionId, member_id: memberId });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You've already checked in" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Check-in failed: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
